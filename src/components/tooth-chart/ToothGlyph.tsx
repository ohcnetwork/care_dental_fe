import type { Marker } from "@/lib/markers";
import type { ToothClass } from "@/lib/teeth";

/** Colors the chart resolves from the host theme when it is mounted in
 *  CARE, falling back to CARE's own green when it is not. Never DEFINED
 *  here — a plugin stylesheet redefining `--color-primary-*` would restyle
 *  the host. */
const PRIMARY_50 = "var(--color-primary-50, #f0fdf4)";
const PRIMARY_100 = "var(--color-primary-100, #dcfce7)";
const PRIMARY_400 = "var(--color-primary-400, #4ade80)";
const PRIMARY_600 = "var(--color-primary-600, #16a34a)";
const PRIMARY_700 = "var(--color-primary-700, #15803d)";

export interface ToothGlyphProps {
  toothClass: ToothClass;
  /** Central incisors are broader than laterals; `1` is the midline tooth. */
  position: number;
  /** Whether the tooth is on the chart at all. */
  involved: boolean;
  /** The finding drawn as the tooth's color, when it carries one. */
  marker?: Marker;
  /** Findings beyond the first, drawn as dots. */
  extraMarkers: readonly Marker[];
  hovered: boolean;
}

/** Occlusal-view outline per tooth class — what a printed odontogram
 *  draws: molars as broad crowns with a cusp cross, premolars with one
 *  groove, canines pointed, incisors narrow. */
function Outline({
  toothClass,
  position,
  fill,
  stroke,
  dashed,
}: {
  toothClass: ToothClass;
  position: number;
  fill: string;
  stroke: string;
  dashed: boolean;
}) {
  const common = {
    fill,
    stroke,
    strokeWidth: 1.75,
    strokeDasharray: dashed ? "3 2.5" : undefined,
  };
  switch (toothClass) {
    case "molar":
      return (
        <>
          <rect x={4} y={4} width={32} height={32} rx={9} {...common} />
          <path
            d="M20 9v22M9 20h22"
            stroke={stroke}
            strokeOpacity={0.28}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      );
    case "premolar":
      return (
        <>
          <rect x={7} y={5} width={26} height={30} rx={10} {...common} />
          <path
            d="M20 11v18"
            stroke={stroke}
            strokeOpacity={0.28}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      );
    case "canine":
      return (
        <path
          d="M20 3.5c7 0 12.5 7.5 12.5 16.5S27 36.5 20 36.5 7.5 29 7.5 20 13 3.5 20 3.5Z"
          {...common}
        />
      );
    default: {
      const width = position === 1 ? 22 : 18;
      return (
        <rect
          x={20 - width / 2}
          y={4}
          width={width}
          height={32}
          rx={8}
          {...common}
        />
      );
    }
  }
}

export function ToothGlyph({
  toothClass,
  position,
  involved,
  marker,
  extraMarkers,
  hovered,
}: ToothGlyphProps) {
  const missing = marker?.id === "missing";
  const fill = marker
    ? marker.fill
    : involved
      ? PRIMARY_100
      : hovered
        ? PRIMARY_50
        : "#ffffff";
  const stroke = marker
    ? marker.stroke
    : involved
      ? PRIMARY_600
      : hovered
        ? PRIMARY_400
        : "#d1d5db";

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="block h-auto w-full">
      <Outline
        toothClass={toothClass}
        position={position}
        fill={fill}
        stroke={stroke}
        dashed={missing}
      />
      {marker ? (
        missing ? (
          <path
            d="M13 13l14 14M27 13L13 27"
            stroke={marker.stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ) : (
          <text
            x={20}
            y={extraMarkers.length > 0 ? 21 : 24.5}
            textAnchor="middle"
            fontSize={marker.short.length > 1 ? 11 : 13}
            fontWeight={700}
            fill={marker.text}
            style={{ fontFamily: "inherit" }}
          >
            {marker.short}
          </text>
        )
      ) : involved ? (
        <path
          d="M13.5 20.5l4.5 4.5 9-10"
          fill="none"
          stroke={PRIMARY_700}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {extraMarkers.slice(0, 3).map((extra, index, all) => (
        <circle
          key={extra.id}
          cx={20 + (index - (all.length - 1) / 2) * 6}
          cy={30}
          r={2.2}
          fill={extra.stroke}
        />
      ))}
    </svg>
  );
}
