import { getI18n } from "react-i18next";

import en from "../../public/locale/en.json";
import type {
  QuestionValidationError,
  RegisteredGroupDefinition,
} from "../types/host";
import { PLUGIN_SLUG } from "./constants";

export const validateToothChart: NonNullable<
  RegisteredGroupDefinition["validate"]
> = (question, responses, path) => {
  const children = (question.questions ?? []).filter((child) =>
    ["tooth", "type"].some(
      (key) => child.link_id === `${question.link_id}__${key}`,
    ),
  );
  const seen = new Set<string>();
  return (responses[question.id]?.sub_results ?? []).flatMap(
    (row, rowIndex) => {
      const errors: QuestionValidationError[] = [];
      const values: Record<string, string> = {};
      for (const child of children) {
        const answers =
          row.find((answer) => answer.question_id === child.id)?.values ?? [];
        if (!answers.length) continue; // Required fields are checked by CARE.
        const value = answers[0].value;
        if (
          answers.length !== 1 ||
          typeof value !== "string" ||
          !child.answer_option?.some((option) => option.value === value)
        ) {
          errors.push({
            question_id: child.id,
            response_path: [...path, { questionId: question.id, rowIndex }],
            error: translate("error_choice"),
          });
        } else values[child.link_id.slice(question.link_id.length + 2)] = value;
      }
      const identity = JSON.stringify([values.tooth, values.type]);
      if (!errors.length && values.tooth) {
        if (seen.has(identity))
          errors.push({
            question_id: question.id,
            response_path: path,
            error: translate("error_duplicate_finding"),
          });
        seen.add(identity);
      }
      return errors;
    },
  );
};

function translate(key: "error_choice" | "error_duplicate_finding"): string {
  return (
    getI18n()?.t(key, { ns: PLUGIN_SLUG, defaultValue: en[key] }) || en[key]
  );
}
