import { Eraser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import "@/style/index.css";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import {
  inferDentition,
  parseEntries,
  removeMark,
  removeTooth,
  type Brush,
  type DentitionView,
  type ToothChartEntry,
} from "@/lib/chart";
import { NUMBERING_STORAGE_KEY, TOOTH_CHART_TYPE } from "@/lib/constants";
import type { Numbering } from "@/lib/teeth";
import type { StructuredInputProps } from "@/types/host";

import { BrushBar } from "./BrushBar";
import { ChartNote } from "./ChartNote";
import { ChartSummary } from "./ChartSummary";
import { Segmented } from "./Segmented";
import { ToothChart } from "./ToothChart";

function readNumbering(): Numbering {
  try {
    return localStorage.getItem(NUMBERING_STORAGE_KEY) === "universal"
      ? "universal"
      : "fdi";
  } catch {
    return "fdi";
  }
}

function useNumberingPreference(): [Numbering, (next: Numbering) => void] {
  const [numbering, setNumbering] = useState<Numbering>(readNumbering);
  const update = (next: Numbering) => {
    setNumbering(next);
    try {
      localStorage.setItem(NUMBERING_STORAGE_KEY, next);
    } catch {
      // A blocked storage only loses the preference for next time.
    }
  };
  return [numbering, update];
}

/**
 * The structured input the host mounts for a `care_dental_fe.tooth_chart`
 * question — and, `disabled`, what the response viewers show for a stored
 * answer. The recorded entries live in `response.values[0].value`; every
 * edit hands the host the whole list back, or `[]` when the chart is
 * empty so the question counts as unanswered.
 */
export default function ToothChartInput({
  response,
  onChange,
  disabled,
  errors,
  clearError,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const entries = useMemo(
    () => parseEntries(response.values[0]?.value),
    [response.values],
  );
  const [brush, setBrush] = useState<Brush>("select");
  const [numbering, setNumbering] = useNumberingPreference();
  const [hovered, setHovered] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // The rows on screen: whatever the viewer picked, widened to whatever
  // the recorded teeth need — a primary tooth can never be hidden.
  const inferred = inferDentition(entries);
  const [view, setView] = useState<DentitionView>(inferred ?? "permanent");
  const showPermanent =
    view !== "primary" || inferred === "permanent" || inferred === "mixed";
  const showPrimary =
    view !== "permanent" || inferred === "primary" || inferred === "mixed";

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const commit = (next: ToothChartEntry[]) => {
    onChange(
      next.length > 0 ? [{ type: TOOTH_CHART_TYPE, value: next }] : [],
      response.note,
    );
    if (errors.length > 0) clearError();
  };

  const commitNote = (note: string | undefined) => {
    onChange(response.values, note ?? "");
  };

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      for (const mark of entry.marks ?? []) {
        map.set(mark, (map.get(mark) ?? 0) + 1);
      }
    }
    return map;
  }, [entries]);

  const numberingControl = (
    <Segmented
      size={disabled ? "xs" : "sm"}
      aria-label={t("numbering")}
      value={numbering}
      onChange={setNumbering}
      options={[
        { value: "fdi", label: t("numbering_fdi") },
        { value: "universal", label: t("numbering_universal") },
      ]}
    />
  );

  return (
    // `care-dental-fe` is the scope the production stylesheet is nested
    // under (vite.config.ts) — every element the chart renders lives below
    // this root, so the plugin's utilities can never touch the host page.
    <div
      className={cn(
        "care-dental-fe space-y-3 rounded-lg border border-gray-200 bg-white",
        disabled ? "p-2" : "p-3",
      )}
    >
      {disabled ? (
        <div className="flex justify-end">{numberingControl}</div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <BrushBar brush={brush} onChange={setBrush} counts={counts} />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              aria-label={t("dentition")}
              value={view}
              onChange={setView}
              options={[
                { value: "permanent", label: t("dentition_permanent") },
                { value: "mixed", label: t("dentition_mixed") },
                { value: "primary", label: t("dentition_primary") },
              ]}
            />
            {numberingControl}
            {entries.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true);
                    return;
                  }
                  setConfirmClear(false);
                  commit([]);
                }}
                onBlur={() => setConfirmClear(false)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:outline-none",
                  confirmClear
                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Eraser aria-hidden="true" className="size-3.5" />
                {confirmClear
                  ? `${t("clear_all")} · ${t("teeth_count", { count: entries.length })}?`
                  : t("clear_all")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className={cn("rounded-md bg-gray-50", disabled && "bg-gray-50/60")}>
        <ToothChart
          entries={entries}
          brush={brush}
          numbering={numbering}
          showPermanent={showPermanent}
          showPrimary={showPrimary}
          readOnly={disabled}
          hovered={hovered}
          onHover={setHovered}
          onChange={commit}
        />
      </div>

      <ChartSummary
        entries={entries}
        numbering={numbering}
        readOnly={disabled}
        onHover={setHovered}
        onRemoveMark={(tooth, mark) => commit(removeMark(entries, tooth, mark))}
        onRemoveTooth={(tooth) => commit(removeTooth(entries, tooth))}
      />

      <ChartNote
        note={response.note}
        readOnly={disabled}
        onChange={commitNote}
      />
    </div>
  );
}
