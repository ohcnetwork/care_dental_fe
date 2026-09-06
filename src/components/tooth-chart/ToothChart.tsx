import { useCallback, useEffect, useRef, useState } from "react";

import { useToothLabel } from "@/hooks/useToothLabel";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import {
  applyBrush,
  applyBrushToMany,
  brushCovers,
  brushOpFor,
  entryFor,
  type Brush,
  type BrushOp,
  type ToothChartEntry,
} from "@/lib/chart";
import { CHART_ROWS, type Numbering, type Tooth } from "@/lib/teeth";

import { ToothButton } from "./ToothButton";

export interface ToothChartProps {
  entries: readonly ToothChartEntry[];
  brush: Brush;
  numbering: Numbering;
  showPermanent: boolean;
  showPrimary: boolean;
  readOnly: boolean;
  hovered: string | null;
  onHover: (tooth: string | null) => void;
  onChange: (next: ToothChartEntry[]) => void;
}

interface RowSpec {
  key: keyof typeof CHART_ROWS;
  teeth: readonly Tooth[];
  numberPosition: "top" | "bottom";
  /** Sign of the arch bend: upper rows dip at the ends, lower rows rise. */
  bend: 1 | -1;
  primary: boolean;
}

const ROWS: RowSpec[] = [
  {
    key: "upperPermanent",
    teeth: CHART_ROWS.upperPermanent,
    numberPosition: "top",
    bend: 1,
    primary: false,
  },
  {
    key: "upperPrimary",
    teeth: CHART_ROWS.upperPrimary,
    numberPosition: "bottom",
    bend: 1,
    primary: true,
  },
  {
    key: "lowerPrimary",
    teeth: CHART_ROWS.lowerPrimary,
    numberPosition: "top",
    bend: -1,
    primary: true,
  },
  {
    key: "lowerPermanent",
    teeth: CHART_ROWS.lowerPermanent,
    numberPosition: "bottom",
    bend: -1,
    primary: false,
  },
];

/** A gentle parabola per row — the incisors sit at the crest of each arch,
 *  the molars fall away from it, and the two arches face each other. */
function archOffset(tooth: Tooth, row: RowSpec): number {
  const span = row.primary ? 4 : 7;
  const max = row.primary ? 5 : 9;
  const t = (tooth.position - 1) / span;
  return Math.round(row.bend * max * t * t * 10) / 10;
}

/** The tooth in `row` that sits nearest to `tooth` across the arch: same
 *  side, same position (clamped for the shorter primary rows). */
function neighbourAcross(tooth: Tooth, row: RowSpec): Tooth | undefined {
  const position = Math.min(tooth.position, row.primary ? 5 : 8);
  return row.teeth.find(
    (candidate) =>
      candidate.side === tooth.side && candidate.position === position,
  );
}

function toothFromEvent(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-tooth]")?.dataset.tooth ?? null;
}

export function ToothChart({
  entries,
  brush,
  numbering,
  showPermanent,
  showPrimary,
  readOnly,
  hovered,
  onHover,
  onChange,
}: ToothChartProps) {
  const { t } = useTranslation();
  const { toothDescription, quadrantName } = useToothLabel(numbering);
  const rootRef = useRef<HTMLDivElement>(null);
  // Painting accumulates several taps in one gesture before React commits
  // the first; the ref keeps each step building on the previous one.
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const painting = useRef<{ op: BrushOp; visited: Set<string> } | null>(null);
  const [roving, setRoving] = useState<string | null>(null);

  const visibleRows = ROWS.filter((row) =>
    row.primary ? showPrimary : showPermanent,
  );
  const firstVisible = visibleRows[0]?.teeth[0]?.fdi ?? null;
  const rovingVisible =
    roving !== null &&
    visibleRows.some((row) => row.teeth.some((tooth) => tooth.fdi === roving));
  const tabStop = rovingVisible ? roving : firstVisible;

  const commit = useCallback(
    (next: ToothChartEntry[]) => {
      entriesRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const apply = useCallback(
    (tooth: string, op?: BrushOp) =>
      commit(applyBrush(entriesRef.current, tooth, brush, op)),
    [brush, commit],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (readOnly || event.button !== 0) return;
      const tooth = event.currentTarget.dataset.tooth;
      if (!tooth) return;
      const op = brushOpFor(entriesRef.current, tooth, brush);
      apply(tooth, op);
      // Dragging across teeth paints them all the same way the first one
      // went. Mouse and pen only — on touch the same gesture is a scroll,
      // and the browser cancels the pointer once it recognises one.
      if (event.pointerType === "touch") return;
      painting.current = { op, visited: new Set([tooth]) };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [apply, brush, readOnly],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const stroke = painting.current;
      if (!stroke) return;
      const tooth = toothFromEvent(
        document.elementFromPoint(event.clientX, event.clientY),
      );
      if (!tooth) return;
      onHover(tooth);
      if (stroke.visited.has(tooth)) return;
      stroke.visited.add(tooth);
      apply(tooth, stroke.op);
    },
    [apply, onHover],
  );

  const handlePointerEnd = useCallback(() => {
    painting.current = null;
  }, []);

  const focusTooth = (fdi: string) => {
    rootRef.current
      ?.querySelector<HTMLButtonElement>(`[data-tooth="${fdi}"]`)
      ?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = toothFromEvent(event.target);
    if (!current) return;
    const rowIndex = visibleRows.findIndex((row) =>
      row.teeth.some((tooth) => tooth.fdi === current),
    );
    if (rowIndex === -1) return;
    const row = visibleRows[rowIndex];
    const column = row.teeth.findIndex((tooth) => tooth.fdi === current);
    let next: Tooth | undefined;
    switch (event.key) {
      case "ArrowRight":
        next = row.teeth[column + 1];
        break;
      case "ArrowLeft":
        next = row.teeth[column - 1];
        break;
      case "ArrowDown":
      case "ArrowUp": {
        const target =
          visibleRows[rowIndex + (event.key === "ArrowDown" ? 1 : -1)];
        if (target) next = neighbourAcross(row.teeth[column], target);
        break;
      }
      case "Home":
        next = row.teeth[0];
        break;
      case "End":
        next = row.teeth[row.teeth.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next) focusTooth(next.fdi);
  };

  // A pointer released outside any tooth (or the window) must end the
  // stroke too, or the next hover would keep painting.
  useEffect(() => {
    const end = () => {
      painting.current = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const quadrantButton = (quadrant: number, sample: Tooth) => {
    const teeth = ROWS.flatMap((row) => row.teeth).filter(
      (tooth) => tooth.quadrant === quadrant,
    );
    const codes = teeth.map((tooth) => tooth.fdi);
    const covered = brushCovers(entriesRef.current, codes, brush);
    const name = quadrantName(sample);
    if (readOnly) {
      return <span className="text-[11px] text-gray-400">{name}</span>;
    }
    return (
      <button
        type="button"
        aria-label={t(covered ? "unselect_quadrant" : "select_quadrant", {
          quadrant: name.toLowerCase(),
        })}
        title={t(covered ? "unselect_quadrant" : "select_quadrant", {
          quadrant: name.toLowerCase(),
        })}
        onClick={() =>
          commit(
            applyBrushToMany(
              entriesRef.current,
              codes,
              brush,
              covered ? "remove" : "add",
            ),
          )
        }
        className="rounded text-[11px] font-medium text-gray-500 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:outline-none"
      >
        {name}
      </button>
    );
  };

  const hoveredTooth = hovered
    ? ROWS.flatMap((row) => row.teeth).find((tooth) => tooth.fdi === hovered)
    : undefined;
  const caption = hoveredTooth
    ? toothDescription(hoveredTooth, entryFor(entries, hoveredTooth.fdi))
    : readOnly
      ? ""
      : t("brush_hint");

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={t("tooth_chart_label")}
      onKeyDown={handleKeyDown}
      className="@container"
    >
      <div className="overflow-x-auto">
        <div className="min-w-fit space-y-1 px-1 py-2">
          <div className="flex justify-between px-1 text-[10px] font-medium tracking-wide text-gray-400 uppercase">
            <span>{t("patient_right")}</span>
            <span>{t("patient_left")}</span>
          </div>
          {visibleRows.map((row) => {
            const midpoint = row.teeth.length / 2;
            const rightQuadrant = row.teeth[0];
            const leftQuadrant = row.teeth[row.teeth.length - 1];
            return (
              <div
                key={row.key}
                className={cn(
                  "flex items-center gap-2",
                  // Widths that keep a full row inside the container at each
                  // step: 16 teeth + gaps + midline, plus the two quadrant
                  // labels once they appear at @3xl.
                  row.primary
                    ? "[--tooth-size:22px] @xl:[--tooth-size:26px] @4xl:[--tooth-size:30px] @5xl:[--tooth-size:34px]"
                    : "[--tooth-size:28px] @xl:[--tooth-size:32px] @4xl:[--tooth-size:38px] @5xl:[--tooth-size:44px]",
                  row.bend === 1 ? "pb-2" : "pt-2",
                )}
              >
                <div className="hidden w-20 shrink-0 text-right @3xl:block">
                  {!row.primary &&
                    quadrantButton(rightQuadrant.quadrant, rightQuadrant)}
                </div>
                <div className="flex flex-1 items-center justify-center gap-0.5">
                  {row.teeth.map((tooth, index) => {
                    const entry = entryFor(entries, tooth.fdi);
                    return (
                      <div key={tooth.fdi} className="contents">
                        {index === midpoint && (
                          <span
                            aria-hidden="true"
                            className="mx-0.5 h-8 w-px shrink-0 border-l border-dashed border-gray-300"
                          />
                        )}
                        <ToothButton
                          tooth={tooth}
                          entry={entry}
                          numbering={numbering}
                          label={toothDescription(tooth, entry)}
                          numberPosition={row.numberPosition}
                          archOffset={archOffset(tooth, row)}
                          hovered={hovered === tooth.fdi}
                          readOnly={readOnly}
                          tabStop={tabStop === tooth.fdi}
                          onHover={onHover}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerEnd={handlePointerEnd}
                          onKeyboardActivate={(fdi) => apply(fdi)}
                          onFocus={setRoving}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="hidden w-20 shrink-0 @3xl:block">
                  {!row.primary &&
                    quadrantButton(leftQuadrant.quadrant, leftQuadrant)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p
        aria-live="polite"
        className="min-h-4 truncate px-1 text-xs text-gray-500"
      >
        {caption}
      </p>
    </div>
  );
}
