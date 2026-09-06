import { getI18n } from "react-i18next";

import en from "../../public/locale/en.json";
import { NAMESPACE } from "@/hooks/useTranslation";
import { parseEntries } from "./chart";
import type { QuestionValidationError } from "@/types/host";

/**
 * Submit-time validation the host runs over the recorded entries. The host
 * already blocks a REQUIRED question whose answer is empty; this catches
 * the one case it cannot see — entries that exist but name no tooth this
 * legend knows (a hand-edited draft), which would submit an answer that
 * renders as nothing.
 */
export function validateToothChart(
  data: unknown[],
  questionId: string,
  required: boolean,
): QuestionValidationError[] {
  if (!required || parseEntries(data).length > 0) return [];
  // `react-i18next` is a host singleton, so this is the host's i18n
  // instance (when it exists) with this plugin's namespace loaded.
  const i18n = getI18n();
  const error = i18n
    ? i18n.t("required_error", {
        ns: NAMESPACE,
        defaultValue: en.required_error,
      })
    : en.required_error;
  return [{ question_id: questionId, error }];
}
