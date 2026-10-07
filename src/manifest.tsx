import { lazy } from "react";

import { ToothIcon } from "./components/ToothIcon";
import { PLUGIN_SLUG, TOOTH_CHART_TYPE } from "./lib/constants";
import { TOOTH_CHART_SCHEMA } from "./lib/group";
import { validateToothChart } from "./lib/validate";
import type { PluginManifest } from "./types/host";

const manifest: PluginManifest = {
  plugin: PLUGIN_SLUG,
  registeredQuestionGroups: [
    {
      type: TOOTH_CHART_TYPE,
      label: "Dental chart",
      icon: ToothIcon,
      repeats: true,
      schema: TOOTH_CHART_SCHEMA,
      validate: validateToothChart,
      builder: lazy(() => import("./components/tooth-chart/ToothChartBuilder")),
      component: lazy(() => import("./components/tooth-chart/ToothChartInput")),
      subjects: ["encounter", "patient"],
    },
  ],
};

export default manifest;
