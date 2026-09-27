import { useState } from "react";

import ToothChartBuilder from "@/components/tooth-chart/ToothChartBuilder";
import ToothChartInput from "@/components/tooth-chart/ToothChartInput";
import { TOOTH_CHART_TYPE } from "@/lib/constants";
import { TOOTH_CHART_SCHEMA } from "@/lib/group";
import type {
  GroupInputProps,
  Question,
  QuestionnaireResponse,
} from "@/types/host";

const initialQuestion: Question = {
  id: "harness-question",
  link_id: "dental_chart",
  text: "Dental examination",
  type: "group",
  repeats: true,
  structured_type: TOOTH_CHART_TYPE,
  questions: TOOTH_CHART_SCHEMA.map((field) => ({
    ...field,
    id: `harness-${field.link_id}`,
    link_id: `dental_chart__${field.link_id}`,
    questions: undefined,
  })),
};

function newRow(
  updates: Parameters<GroupInputProps["addRow"]>[0] = {},
): QuestionnaireResponse[] {
  return initialQuestion.questions!.map((question) => ({
    question_id: question.id,
    link_id: question.link_id,
    structured_type: null,
    values: [],
    ...updates[question.link_id.slice(initialQuestion.link_id.length + 2)],
  }));
}

export function Harness() {
  const [question, setQuestion] = useState(initialQuestion);
  const [responses, setResponses] = useState<QuestionnaireResponse[][]>(() =>
    [
      ["16", "caries"],
      ["16", "mobile"],
      ["26", "filled"],
      ["36", "missing"],
      ["11", undefined],
    ].map(([tooth, type]) =>
      newRow({
        tooth: { values: [{ type: "string", value: tooth }] },
        type: { values: type ? [{ type: "string", value: type }] : [] },
      }),
    ),
  );
  const [readOnly, setReadOnly] = useState(false);
  const fieldsFor = (row: QuestionnaireResponse[]) =>
    Object.fromEntries(
      question.questions!.map((child) => [
        child.link_id.slice(question.link_id.length + 2),
        {
          question: child,
          response: row.find(({ question_id }) => question_id === child.id)!,
          disabled: readOnly,
          hidden: false,
          errors: [],
        },
      ]),
    );
  const rows: GroupInputProps["rows"] = responses.map((saved) => ({
    fields: fieldsFor(saved),
    onChange: (updates) =>
      setResponses((current) =>
        current.map((row) =>
          row !== saved
            ? row
            : row.map((response) => ({
                ...response,
                ...updates[response.link_id.slice(question.link_id.length + 2)],
              })),
        ),
      ),
    remove: () =>
      setResponses((current) => current.filter((row) => row !== saved)),
  }));
  const addRow: GroupInputProps["addRow"] = (updates) =>
    setResponses((current) => [...current, newRow(updates)]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6 font-sans text-gray-900">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{question.text}</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(event) => setReadOnly(event.target.checked)}
          />
          Read-only (response viewer)
        </label>
      </header>
      <ToothChartBuilder
        question={question}
        onChange={(patch) =>
          setQuestion((current) => ({ ...current, ...patch }))
        }
      />
      <ToothChartInput
        question={question}
        fields={fieldsFor(newRow())}
        rows={rows}
        addRow={addRow}
        onChange={() => {}}
        disabled={readOnly}
      />
      <pre className="overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
        {JSON.stringify(
          { question_id: question.id, values: [], sub_results: responses },
          null,
          2,
        )}
      </pre>
    </main>
  );
}
