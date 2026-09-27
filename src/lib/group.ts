import en from "../../public/locale/en.json";
import type {
  GroupInputProps,
  GroupQuestionDefinition,
  GroupRow,
  QuestionnaireResponse,
} from "../types/host";
import { parseEntries, type ToothChartEntry } from "./chart";
import { MARKERS } from "./markers";
import { TEETH } from "./teeth";

export const TOOTH_CHART_SCHEMA: readonly GroupQuestionDefinition[] = [
  {
    link_id: "tooth",
    text: en.tooth,
    type: "choice",
    required: true,
    answer_option: TEETH.map(({ fdi }) => ({ value: fdi, display: fdi })),
  },
  {
    link_id: "type",
    text: en.finding_type,
    type: "choice",
    answer_option: MARKERS.map(({ id }) => ({
      value: id,
      display: en[`marker_${id}` as keyof typeof en],
    })),
  },
];

type Fields = GroupInputProps["fields"];

function rowValue(row: GroupRow, key: string): string | undefined {
  const field = row.fields[key];
  const value =
    field && !field.hidden ? field.response.values[0]?.value : undefined;
  return typeof value === "string" ? value : undefined;
}

export function chartTeeth(fields: Fields) {
  const field = fields.tooth;
  if (!field || field.hidden) return [];
  const options = new Set(
    field.question.answer_option?.map(({ value }) => value),
  );
  return TEETH.filter(({ fdi }) => options.has(fdi));
}

export function chartEntries(rows: readonly GroupRow[]): ToothChartEntry[] {
  return parseEntries(
    rows.map((row) => {
      const type = rowValue(row, "type");
      return { tooth: rowValue(row, "tooth"), marks: type ? [type] : [] };
    }),
  );
}

export function toothIsEditable(
  fields: Fields,
  rows: readonly GroupRow[],
  tooth: string,
  brush = "select",
) {
  const toothField = fields.tooth;
  const typeField = fields.type;
  if (!toothField || toothField.disabled || toothField.hidden) return false;
  if (
    brush !== "select" &&
    (!typeField ||
      typeField.disabled ||
      typeField.hidden ||
      !typeField.question.answer_option?.some(({ value }) => value === brush))
  )
    return false;
  return rows
    .filter((row) => rowValue(row, "tooth") === tooth)
    .every(
      (row) =>
        !row.fields.tooth?.disabled &&
        !row.fields.tooth?.hidden &&
        (!row.fields.type ||
          (!row.fields.type.disabled && !row.fields.type.hidden)),
    );
}

function choice(value?: string): Partial<QuestionnaireResponse> {
  return { values: value ? [{ type: "string", value }] : [] };
}

/** Reconcile chart entries with ordinary rows, reusing an empty same-tooth row first. */
export function updateChartRows(
  fields: Fields,
  rows: readonly GroupRow[],
  next: readonly ToothChartEntry[],
  addRow: GroupInputProps["addRow"],
  previous: readonly ToothChartEntry[] = chartEntries(rows),
) {
  for (const { fdi } of chartTeeth(fields)) {
    if (!toothIsEditable(fields, rows, fdi)) continue;
    const entry = next.find(({ tooth }) => tooth === fdi);
    const before = previous.find(({ tooth }) => tooth === fdi);
    const marks = entry?.marks ?? [];
    const previousMarks = before?.marks ?? [];
    if (
      !!entry === !!before &&
      marks.length === previousMarks.length &&
      marks.every((mark, index) => mark === previousMarks[index])
    )
      continue;
    const desired: (string | undefined)[] = entry
      ? fields.type && entry.marks?.length
        ? entry.marks
        : [undefined]
      : [];
    const current = rows.filter((row) => rowValue(row, "tooth") === fdi);
    const obsolete = current.filter(
      (row) => !desired.includes(rowValue(row, "type")),
    );
    for (const type of desired) {
      if (current.some((row) => rowValue(row, "type") === type)) continue;
      if (type && !fields.type) continue;
      const reuse = obsolete.shift();
      if (reuse?.fields.type) reuse.onChange({ type: choice(type) });
      else
        addRow({
          tooth: choice(fdi),
          ...(fields.type ? { type: choice(type) } : {}),
        });
    }
    for (const row of obsolete) row.remove();
  }
}
