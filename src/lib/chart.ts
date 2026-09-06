import { markerPriority } from "./markers";
import { isFdiCode, toothByFdi } from "./teeth";

/**
 * What one dental chart question records, and every operation the chart
 * performs on it. Pure functions over a sorted, tooth-unique entry list so
 * the component stays a thin view.
 *
 * Stored shape (the question's answer, `values[0].value`):
 *   [{ tooth: "16", marks: ["caries"] }, { tooth: "21" }]
 * — one entry per involved tooth, FDI code, optional findings from the
 * legend. An entry with no marks is a plain selection ("this tooth").
 */
export interface ToothChartEntry {
  tooth: string;
  marks?: string[];
}

/** What a tap does: `select` involves/uninvolves a tooth; a marker id
 *  toggles that finding on it. */
export type Brush = "select" | (string & {});

export type BrushOp = "add" | "remove";

function normalizeMarks(marks: unknown): string[] {
  if (!Array.isArray(marks)) return [];
  const seen = new Set<string>();
  for (const mark of marks) {
    if (typeof mark === "string" && mark.trim() !== "") seen.add(mark);
  }
  return Array.from(seen).sort(
    (a, b) => markerPriority(a) - markerPriority(b) || a.localeCompare(b),
  );
}

function entry(tooth: string, marks: string[]): ToothChartEntry {
  return marks.length > 0 ? { tooth, marks } : { tooth };
}

function sortEntries(entries: ToothChartEntry[]): ToothChartEntry[] {
  return entries.sort((a, b) => Number(a.tooth) - Number(b.tooth));
}

/**
 * Whatever the response holds → a clean entry list. Tolerant on purpose:
 * the data crosses a draft, a server round trip and possibly a hand edit,
 * so unknown teeth are dropped, duplicate teeth merge their findings, and
 * marks are deduplicated and ordered by legend priority.
 */
export function parseEntries(data: unknown): ToothChartEntry[] {
  if (!Array.isArray(data)) return [];
  const byTooth = new Map<string, Set<string>>();
  for (const item of data) {
    if (typeof item !== "object" || item === null) continue;
    const { tooth, marks } = item as { tooth?: unknown; marks?: unknown };
    if (!isFdiCode(tooth)) continue;
    const set = byTooth.get(tooth) ?? new Set<string>();
    for (const mark of normalizeMarks(marks)) set.add(mark);
    byTooth.set(tooth, set);
  }
  return sortEntries(
    Array.from(byTooth, ([tooth, marks]) =>
      entry(tooth, normalizeMarks(Array.from(marks))),
    ),
  );
}

export function entryFor(
  entries: readonly ToothChartEntry[],
  tooth: string,
): ToothChartEntry | undefined {
  return entries.find((item) => item.tooth === tooth);
}

/** The finding drawn as the tooth's color when it carries several. */
export function primaryMark(item: ToothChartEntry): string | undefined {
  return item.marks?.[0];
}

/** Whether a tap with this brush would ADD to the tooth (or remove). */
export function brushOpFor(
  entries: readonly ToothChartEntry[],
  tooth: string,
  brush: Brush,
): BrushOp {
  const current = entryFor(entries, tooth);
  if (!current) return "add";
  if (brush === "select") return "remove";
  return current.marks?.includes(brush) ? "remove" : "add";
}

/**
 * One tap. `select` adds the tooth or removes it outright (findings and
 * all); a marker adds that finding, or removes it — and a tooth left with
 * no findings leaves the chart, so a mis-tap undoes itself with a second
 * tap. Pass `op` to force the direction (painting across teeth applies the
 * first tooth's direction to every tooth the pointer crosses).
 */
export function applyBrush(
  entries: readonly ToothChartEntry[],
  tooth: string,
  brush: Brush,
  op: BrushOp = brushOpFor(entries, tooth, brush),
): ToothChartEntry[] {
  if (!toothByFdi(tooth)) return entries.slice();
  const current = entryFor(entries, tooth);
  const rest = entries.filter((item) => item.tooth !== tooth);

  if (brush === "select") {
    if (op === "remove") return rest;
    return current ? entries.slice() : sortEntries([...rest, entry(tooth, [])]);
  }

  const marks = new Set(current?.marks ?? []);
  if (op === "add") {
    if (marks.has(brush) && current) return entries.slice();
    marks.add(brush);
    return sortEntries([...rest, entry(tooth, normalizeMarks([...marks]))]);
  }
  if (!marks.has(brush)) return entries.slice();
  marks.delete(brush);
  if (marks.size === 0) return rest;
  return sortEntries([...rest, entry(tooth, normalizeMarks([...marks]))]);
}

export function applyBrushToMany(
  entries: readonly ToothChartEntry[],
  teeth: readonly string[],
  brush: Brush,
  op: BrushOp,
): ToothChartEntry[] {
  let next = entries.slice();
  for (const tooth of teeth) next = applyBrush(next, tooth, brush, op);
  return next;
}

/** Whether every tooth in `teeth` already carries what the brush adds. */
export function brushCovers(
  entries: readonly ToothChartEntry[],
  teeth: readonly string[],
  brush: Brush,
): boolean {
  return teeth.every((tooth) => brushOpFor(entries, tooth, brush) === "remove");
}

export function removeTooth(
  entries: readonly ToothChartEntry[],
  tooth: string,
): ToothChartEntry[] {
  return entries.filter((item) => item.tooth !== tooth);
}

export function removeMark(
  entries: readonly ToothChartEntry[],
  tooth: string,
  mark: string,
): ToothChartEntry[] {
  return applyBrush(entries, tooth, mark, "remove");
}

export interface SummaryGroup {
  /** `null` for teeth that are selected without a finding. */
  mark: string | null;
  teeth: string[];
}

/** The chart, read out: one group per finding in legend order, then the
 *  plain selections. A tooth with two findings appears under both. */
export function summarize(entries: readonly ToothChartEntry[]): SummaryGroup[] {
  const byMark = new Map<string, string[]>();
  const plain: string[] = [];
  for (const item of entries) {
    if (!item.marks || item.marks.length === 0) {
      plain.push(item.tooth);
      continue;
    }
    for (const mark of item.marks) {
      const list = byMark.get(mark) ?? [];
      list.push(item.tooth);
      byMark.set(mark, list);
    }
  }
  const groups: SummaryGroup[] = Array.from(byMark, ([mark, teeth]) => ({
    mark,
    teeth,
  })).sort(
    (a, b) =>
      markerPriority(a.mark as string) - markerPriority(b.mark as string) ||
      (a.mark as string).localeCompare(b.mark as string),
  );
  if (plain.length > 0) groups.push({ mark: null, teeth: plain });
  return groups;
}

export type DentitionView = "permanent" | "mixed" | "primary";

/** Which rows the recorded teeth need on screen — `undefined` when the
 *  chart is empty and the default applies. */
export function inferDentition(
  entries: readonly ToothChartEntry[],
): DentitionView | undefined {
  let permanent = false;
  let primary = false;
  for (const item of entries) {
    const tooth = toothByFdi(item.tooth);
    if (!tooth) continue;
    if (tooth.dentition === "primary") primary = true;
    else permanent = true;
  }
  if (permanent && primary) return "mixed";
  if (primary) return "primary";
  if (permanent) return "permanent";
  return undefined;
}
