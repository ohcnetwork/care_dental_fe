import { Check, MousePointerClick } from "lucide-react";
import { useRef } from "react";

import { useToothLabel } from "@/hooks/useToothLabel";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/cn";
import type { Brush } from "@/lib/chart";
import { MARKERS } from "@/lib/markers";

interface BrushBarProps {
  brush: Brush;
  onChange: (brush: Brush) => void;
  /** How many teeth currently carry each finding — shown on the chip. */
  counts: ReadonlyMap<string, number>;
}

/**
 * The legend, as the tool: Select plus one chip per finding. A radiogroup —
 * exactly one brush is active, arrows move between chips, and the chip's
 * swatch is the color the finding paints teeth with.
 */
export function BrushBar({ brush, onChange, counts }: BrushBarProps) {
  const { t } = useTranslation();
  const { markerName } = useToothLabel("fdi");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const options: {
    id: Brush;
    label: string;
    swatch?: string;
    count?: number;
  }[] = [
    { id: "select", label: t("brush_select") },
    ...MARKERS.map((marker) => ({
      id: marker.id,
      label: markerName(marker.id),
      swatch: marker.stroke,
      count: counts.get(marker.id),
    })),
  ];
  const selectedIndex = Math.max(
    options.findIndex((option) => option.id === brush),
    0,
  );

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("brush_hint")}
      className="flex flex-wrap items-center gap-1.5"
    >
      {options.map((option, index) => {
        const active = option.id === brush;
        return (
          <button
            key={option.id}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:ring-offset-1 focus-visible:outline-none",
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
            )}
          >
            {option.swatch ? (
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full ring-1 ring-white/60"
                style={{ backgroundColor: option.swatch }}
              />
            ) : (
              <MousePointerClick aria-hidden="true" className="size-3.5" />
            )}
            {option.label}
            {option.count ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  active ? "bg-white/20" : "bg-gray-100 text-gray-600",
                )}
              >
                {option.count}
              </span>
            ) : null}
            {active && <Check aria-hidden="true" className="size-3" />}
          </button>
        );
      })}
    </div>
  );
}
