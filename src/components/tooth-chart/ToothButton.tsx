import { memo } from "react";

import { cn } from "@/lib/cn";
import type { ToothChartEntry } from "@/lib/chart";
import { UNKNOWN_MARKER, markerById } from "@/lib/markers";
import { formatToothNumber, type Numbering, type Tooth } from "@/lib/teeth";

import { ToothGlyph } from "./ToothGlyph";

export interface ToothButtonProps {
  tooth: Tooth;
  entry: ToothChartEntry | undefined;
  numbering: Numbering;
  /** Accessible name — name, number and findings. */
  label: string;
  /** Number above the glyph (outer edge of the upper arch) or below. */
  numberPosition: "top" | "bottom";
  /** Vertical offset that bends the row into a gentle arch. */
  archOffset: number;
  hovered: boolean;
  readOnly: boolean;
  /** Roving tabindex: one tab stop per chart. */
  tabStop: boolean;
  onHover: (tooth: string | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnd: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onKeyboardActivate: (tooth: string) => void;
  onFocus: (tooth: string) => void;
}

export const ToothButton = memo(function ToothButton({
  tooth,
  entry,
  numbering,
  label,
  numberPosition,
  archOffset,
  hovered,
  readOnly,
  tabStop,
  onHover,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
  onKeyboardActivate,
  onFocus,
}: ToothButtonProps) {
  const marks = entry?.marks ?? [];
  const markers = marks.map((id) => markerById(id) ?? UNKNOWN_MARKER);
  const number = (
    <span
      className={cn(
        "text-[11px] leading-none tabular-nums",
        entry ? "font-semibold text-gray-800" : "text-gray-500",
      )}
    >
      {formatToothNumber(tooth, numbering)}
    </span>
  );

  return (
    <button
      type="button"
      data-tooth={tooth.fdi}
      aria-label={label}
      aria-pressed={!!entry}
      aria-disabled={readOnly || undefined}
      tabIndex={tabStop ? 0 : -1}
      title={label}
      className={cn(
        "flex w-(--tooth-size) shrink-0 touch-manipulation flex-col items-center gap-0.5 rounded-md p-0.5 select-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#22c55e)] focus-visible:ring-offset-1 focus-visible:outline-none",
        readOnly ? "cursor-default" : "cursor-pointer",
      )}
      style={{ transform: `translateY(${archOffset}px)` }}
      onPointerEnter={() => onHover(tooth.fdi)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onFocus(tooth.fdi)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClick={(event) => {
        // Keyboard activation only (`detail` is the click count; a key
        // press reports 0). Pointer taps are handled on pointerdown, and
        // the click that follows them must not toggle the tooth back.
        if (event.detail === 0 && !readOnly) onKeyboardActivate(tooth.fdi);
      }}
    >
      {numberPosition === "top" && number}
      <ToothGlyph
        toothClass={tooth.toothClass}
        position={tooth.position}
        involved={!!entry}
        marker={markers[0]}
        extraMarkers={markers.slice(1)}
        hovered={hovered && !readOnly}
      />
      {numberPosition === "bottom" && number}
    </button>
  );
});
