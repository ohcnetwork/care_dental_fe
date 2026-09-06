import { X } from "lucide-react";

import { useToothLabel } from "@/hooks/useToothLabel";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import { summarize, type ToothChartEntry } from "@/lib/chart";
import { UNKNOWN_MARKER, markerById } from "@/lib/markers";
import { formatToothNumber, toothByFdi, type Numbering } from "@/lib/teeth";

interface ChartSummaryProps {
  entries: readonly ToothChartEntry[];
  numbering: Numbering;
  readOnly: boolean;
  onHover: (tooth: string | null) => void;
  onRemoveMark: (tooth: string, mark: string) => void;
  onRemoveTooth: (tooth: string) => void;
}

const PRIMARY_600 = "var(--color-primary-600, #16a34a)";

/**
 * The chart read out as text: one line per finding in legend order, each
 * tooth a chip that can be removed on its own; plain selections last. This
 * is also what the answer looks like wherever the chart is shown read-only
 * — the numbers are the record, the drawing is the aid.
 */
export function ChartSummary({
  entries,
  numbering,
  readOnly,
  onHover,
  onRemoveMark,
  onRemoveTooth,
}: ChartSummaryProps) {
  const { t } = useTranslation();
  const { markerName, toothName } = useToothLabel(numbering);
  const groups = summarize(entries);

  if (groups.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        {readOnly ? "—" : t("no_teeth_marked")}
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {groups.map((group) => {
        const marker = group.mark
          ? (markerById(group.mark) ?? UNKNOWN_MARKER)
          : undefined;
        const label = group.mark ? markerName(group.mark) : t("selected");
        return (
          <li
            key={group.mark ?? "__selected"}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
          >
            <span className="inline-flex min-w-24 items-center gap-1.5 font-medium text-gray-700">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: marker?.stroke ?? PRIMARY_600 }}
              />
              {label}
              <span className="font-normal text-gray-400">
                {t("teeth_count", { count: group.teeth.length })}
              </span>
            </span>
            <span className="flex flex-wrap gap-1">
              {group.teeth.map((code) => {
                const tooth = toothByFdi(code);
                if (!tooth) return null;
                const number = formatToothNumber(tooth, numbering);
                const removeLabel = group.mark
                  ? t("remove_mark_from_tooth", { mark: label, tooth: number })
                  : t("remove_tooth", { tooth: number });
                return (
                  <span
                    key={code}
                    title={toothName(tooth)}
                    onPointerEnter={() => onHover(code)}
                    onPointerLeave={() => onHover(null)}
                    className={cn(
                      "inline-flex h-6 items-center gap-0.5 rounded-md border bg-white pl-1.5 font-medium text-gray-800 tabular-nums",
                      readOnly ? "pr-1.5" : "pr-0.5",
                    )}
                    style={{ borderColor: marker?.stroke ?? PRIMARY_600 }}
                  >
                    {number}
                    {!readOnly && (
                      <button
                        type="button"
                        aria-label={removeLabel}
                        onClick={() =>
                          group.mark
                            ? onRemoveMark(code, group.mark)
                            : onRemoveTooth(code)
                        }
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:outline-none"
                      >
                        <X aria-hidden="true" className="size-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
