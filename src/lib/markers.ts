/**
 * The chart's legend: the findings a clinician can mark on a tooth. A fixed,
 * conventional set — the ids are what the chart stores, so they must stay
 * stable; the colors are Tailwind palette values (light fill, strong
 * stroke) chosen to stay distinguishable side by side and in print.
 */
export interface Marker {
  id: string;
  /** Glyph drawn on the tooth. */
  short: string;
  fill: string;
  stroke: string;
  text: string;
}

export const MARKERS: readonly Marker[] = [
  {
    id: "caries",
    short: "C",
    fill: "#fee2e2",
    stroke: "#dc2626",
    text: "#991b1b",
  },
  {
    id: "filled",
    short: "F",
    fill: "#dbeafe",
    stroke: "#2563eb",
    text: "#1e40af",
  },
  {
    id: "missing",
    short: "X",
    fill: "#f3f4f6",
    stroke: "#6b7280",
    text: "#374151",
  },
  {
    id: "crown",
    short: "Cr",
    fill: "#fef3c7",
    stroke: "#d97706",
    text: "#92400e",
  },
  {
    id: "rct",
    short: "R",
    fill: "#ede9fe",
    stroke: "#7c3aed",
    text: "#5b21b6",
  },
  {
    id: "fractured",
    short: "Fx",
    fill: "#ffedd5",
    stroke: "#ea580c",
    text: "#9a3412",
  },
  {
    id: "mobile",
    short: "M",
    fill: "#ccfbf1",
    stroke: "#0d9488",
    text: "#115e59",
  },
  {
    id: "extract",
    short: "E",
    fill: "#ffe4e6",
    stroke: "#be123c",
    text: "#9f1239",
  },
];

const BY_ID = new Map(MARKERS.map((marker) => [marker.id, marker]));

export function markerById(id: string): Marker | undefined {
  return BY_ID.get(id);
}

/** Legend order doubles as display priority when a tooth carries several
 *  findings; an id the legend doesn't know sorts last. */
export function markerPriority(id: string): number {
  const index = MARKERS.findIndex((marker) => marker.id === id);
  return index === -1 ? MARKERS.length : index;
}

/** A finding this legend doesn't know — data authored by a newer legend, or
 *  hand-edited. Drawn neutrally so it is visible without being mistaken for
 *  a known finding. */
export const UNKNOWN_MARKER: Marker = {
  id: "unknown",
  short: "?",
  fill: "#f3f4f6",
  stroke: "#9ca3af",
  text: "#4b5563",
};
