import { lazy } from "react";

import { ToothIcon } from "./components/ToothIcon";
import { PLUGIN_SLUG, TOOTH_CHART_TYPE } from "./lib/constants";
import { validateToothChart } from "./lib/validate";
import type { PluginManifest } from "./types/host";

/**
 * What this plugin adds to CARE: one structured question type, "Dental
 * chart". Authors pick it in the questionnaire studio; clinicians fill it
 * as an odontogram; the answer is stored on the questionnaire response
 * itself (`persistence: "response"`), so nothing backend-side is needed.
 */
const manifest: PluginManifest = {
  plugin: PLUGIN_SLUG,
  structuredQuestionTypes: [
    {
      type: TOOTH_CHART_TYPE,
      label: "Dental chart",
      icon: ToothIcon,
      // Lazy: the host mounts structured inputs under Suspense, and the
      // studio's type picker must not pay for the chart's code.
      component: lazy(() => import("./components/tooth-chart/ToothChartInput")),
      requires: [],
      subjects: ["encounter", "patient"],
      draftPolicy: "serialize",
      persistence: "response",
      validate: validateToothChart,
    },
  ],
};

export default manifest;
