import { useState } from "react";

import ToothChartInput from "@/components/tooth-chart/ToothChartInput";
import { TOOTH_CHART_TYPE } from "@/lib/constants";
import type { QuestionnaireResponse, ResponseValue } from "@/types/host";

const question = {
  id: "harness-question",
  link_id: "dental_chart",
  text: "Dental examination",
  type: "structured",
  structured_type: TOOTH_CHART_TYPE,
  required: true,
};

export function Harness() {
  const [response, setResponse] = useState<QuestionnaireResponse>({
    question_id: question.id,
    structured_type: TOOTH_CHART_TYPE,
    link_id: question.link_id,
    values: [
      {
        type: TOOTH_CHART_TYPE,
        value: [
          { tooth: "16", marks: ["caries", "mobile"] },
          { tooth: "26", marks: ["filled"] },
          { tooth: "36", marks: ["missing"] },
          { tooth: "11" },
        ],
      },
    ],
  });
  const [readOnly, setReadOnly] = useState(false);

  const onChange = (values: ResponseValue[], note?: string) =>
    setResponse((current) => ({
      ...current,
      values,
      ...(note === undefined ? {} : { note }),
    }));

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
      <ToothChartInput
        question={question}
        response={response}
        onChange={onChange}
        disabled={readOnly}
        errors={[]}
        clearError={() => {}}
      />
      <pre className="overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
        {JSON.stringify(response, null, 2)}
      </pre>
    </main>
  );
}
