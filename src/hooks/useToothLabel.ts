import { useCallback } from "react";

import { useTranslation } from "@/hooks/useTranslation";
import type { ToothChartEntry } from "@/lib/chart";
import { markerById } from "@/lib/markers";
import { formatToothNumber, type Numbering, type Tooth } from "@/lib/teeth";

const QUADRANT_KEYS = {
  "upper-right": "quadrant_upper_right",
  "upper-left": "quadrant_upper_left",
  "lower-left": "quadrant_lower_left",
  "lower-right": "quadrant_lower_right",
} as const;

/** Human names for teeth and findings, in the viewer's language. */
export function useToothLabel(numbering: Numbering) {
  const { t } = useTranslation();

  const quadrantName = useCallback(
    (tooth: Pick<Tooth, "arch" | "side">) =>
      t(QUADRANT_KEYS[`${tooth.arch}-${tooth.side}`]),
    [t],
  );

  /** "Upper right first molar" / "Primary lower left canine". */
  const toothName = useCallback(
    (tooth: Tooth) => {
      const name = `${quadrantName(tooth)} ${t(tooth.nameKey as never).toLowerCase()}`;
      return tooth.dentition === "primary"
        ? `${t("primary_prefix")} ${name.charAt(0).toLowerCase()}${name.slice(1)}`
        : name;
    },
    [quadrantName, t],
  );

  const markerName = useCallback(
    (id: string) =>
      markerById(id) ? t(`marker_${id}` as never) : t("marker_unknown"),
    [t],
  );

  /** The accessible name of a tooth button: name, number, findings. */
  const toothDescription = useCallback(
    (tooth: Tooth, entry: ToothChartEntry | undefined) => {
      const parts = [toothName(tooth), formatToothNumber(tooth, numbering)];
      if (entry) {
        parts.push(
          entry.marks && entry.marks.length > 0
            ? entry.marks.map(markerName).join(", ")
            : t("selected"),
        );
      }
      return parts.join(", ");
    },
    [markerName, numbering, t, toothName],
  );

  return { toothName, markerName, quadrantName, toothDescription };
}
