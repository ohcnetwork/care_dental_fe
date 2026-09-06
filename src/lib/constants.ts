/** The plugin slug — must equal the directory name under the host's `apps/`
 *  (in-tree dev), the federation `name` and the `REACT_ENABLED_APPS` repo
 *  name (standalone). It is the namespace of every type this plugin owns. */
export const PLUGIN_SLUG = "care_dental_fe";

/** The structured question type this plugin contributes. Questionnaires
 *  store this string in `structured_type`; renaming it orphans them. */
export const TOOTH_CHART_TYPE = `${PLUGIN_SLUG}.tooth_chart`;

/** localStorage key of the viewer's numbering preference (FDI/Universal). A
 *  display choice, per browser — never part of the recorded answer. */
export const NUMBERING_STORAGE_KEY = `${PLUGIN_SLUG}.numbering`;
