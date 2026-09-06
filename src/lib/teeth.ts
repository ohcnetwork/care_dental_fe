/**
 * The dentition, as data. Every tooth is identified by its FDI / ISO 3950
 * two-digit code — the quadrant digit (1–4 permanent, 5–8 primary, clockwise
 * from the patient's upper right) followed by the position from the midline.
 * That code is what the chart stores; Universal (ADA) numbering is a display
 * option only.
 */

export type Arch = "upper" | "lower";
/** The PATIENT's side — the chart draws the right side on the viewer's left,
 *  the way a clinician faces the patient. */
export type Side = "right" | "left";
export type Dentition = "permanent" | "primary";
export type ToothClass = "incisor" | "canine" | "premolar" | "molar";
export type Numbering = "fdi" | "universal";

export interface Tooth {
  /** FDI / ISO 3950 code, e.g. "16", "51". The stored identifier. */
  fdi: string;
  /** Universal (ADA) designation: 1–32 for permanent, A–T for primary. */
  universal: string;
  /** FDI quadrant digit: 1–4 permanent, 5–8 primary. */
  quadrant: number;
  /** 1 at the midline, counting back along the arch. */
  position: number;
  arch: Arch;
  side: Side;
  dentition: Dentition;
  toothClass: ToothClass;
  /** i18n key of the anatomical name ("tooth_first_molar"). */
  nameKey: string;
}

interface QuadrantMeta {
  arch: Arch;
  side: Side;
  dentition: Dentition;
}

const QUADRANTS: Record<number, QuadrantMeta> = {
  1: { arch: "upper", side: "right", dentition: "permanent" },
  2: { arch: "upper", side: "left", dentition: "permanent" },
  3: { arch: "lower", side: "left", dentition: "permanent" },
  4: { arch: "lower", side: "right", dentition: "permanent" },
  5: { arch: "upper", side: "right", dentition: "primary" },
  6: { arch: "upper", side: "left", dentition: "primary" },
  7: { arch: "lower", side: "left", dentition: "primary" },
  8: { arch: "lower", side: "right", dentition: "primary" },
};

const PERMANENT_NAMES = [
  "central_incisor",
  "lateral_incisor",
  "canine",
  "first_premolar",
  "second_premolar",
  "first_molar",
  "second_molar",
  "third_molar",
] as const;

const PRIMARY_NAMES = [
  "central_incisor",
  "lateral_incisor",
  "canine",
  "first_molar",
  "second_molar",
] as const;

const PERMANENT_CLASSES: ToothClass[] = [
  "incisor",
  "incisor",
  "canine",
  "premolar",
  "premolar",
  "molar",
  "molar",
  "molar",
];

const PRIMARY_CLASSES: ToothClass[] = [
  "incisor",
  "incisor",
  "canine",
  "molar",
  "molar",
];

/** Universal numbering runs 1–16 across the upper arch from the patient's
 *  upper-right third molar, then 17–32 back across the lower arch; primary
 *  teeth take A–T the same way. */
function universalOf(quadrant: number, position: number): string {
  switch (quadrant) {
    case 1:
      return String(9 - position);
    case 2:
      return String(8 + position);
    case 3:
      return String(25 - position);
    case 4:
      return String(24 + position);
    case 5:
      return String.fromCharCode(65 + (5 - position));
    case 6:
      return String.fromCharCode(65 + 4 + position);
    case 7:
      return String.fromCharCode(65 + 10 + (5 - position));
    default:
      return String.fromCharCode(65 + 14 + position);
  }
}

function buildTeeth(): Tooth[] {
  const teeth: Tooth[] = [];
  for (const quadrant of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const meta = QUADRANTS[quadrant];
    const names =
      meta.dentition === "permanent" ? PERMANENT_NAMES : PRIMARY_NAMES;
    const classes =
      meta.dentition === "permanent" ? PERMANENT_CLASSES : PRIMARY_CLASSES;
    names.forEach((name, index) => {
      const position = index + 1;
      teeth.push({
        fdi: `${quadrant}${position}`,
        universal: universalOf(quadrant, position),
        quadrant,
        position,
        arch: meta.arch,
        side: meta.side,
        dentition: meta.dentition,
        toothClass: classes[index],
        nameKey: `tooth_${name}`,
      });
    });
  }
  return teeth;
}

/** All 52 teeth — 32 permanent, 20 primary — in FDI order. */
export const TEETH: readonly Tooth[] = buildTeeth();

const BY_FDI = new Map(TEETH.map((tooth) => [tooth.fdi, tooth]));

export function toothByFdi(code: string): Tooth | undefined {
  return BY_FDI.get(code);
}

export function isFdiCode(value: unknown): value is string {
  return typeof value === "string" && BY_FDI.has(value);
}

/** One row of the chart, patient's right first (the viewer's left). */
function row(rightQuadrant: number, leftQuadrant: number): readonly Tooth[] {
  const right = TEETH.filter((tooth) => tooth.quadrant === rightQuadrant)
    .slice()
    .sort((a, b) => b.position - a.position);
  const left = TEETH.filter((tooth) => tooth.quadrant === leftQuadrant);
  return [...right, ...left];
}

/** The chart's rows, top to bottom, each running across the arch from the
 *  patient's right to the patient's left. Primary rows sit between the
 *  permanent arches, where the deciduous teeth erupt. */
export const CHART_ROWS = {
  upperPermanent: row(1, 2),
  upperPrimary: row(5, 6),
  lowerPrimary: row(8, 7),
  lowerPermanent: row(4, 3),
} as const;

export function quadrantTeeth(quadrant: number): readonly Tooth[] {
  return TEETH.filter((tooth) => tooth.quadrant === quadrant);
}

export function formatToothNumber(tooth: Tooth, numbering: Numbering): string {
  return numbering === "universal" ? tooth.universal : tooth.fdi;
}

/** FDI codes in numeric order — the order a dentist reads a chart's summary:
 *  quadrant by quadrant, midline outwards, permanent before primary. */
export function sortFdi(codes: readonly string[]): string[] {
  return codes.slice().sort((a, b) => Number(a) - Number(b));
}
