import assert from "node:assert/strict";
import { test } from "node:test";

import manifest from "../manifest";
import type { Question, QuestionnaireResponse } from "../types/host";

function form(values: [string, string?][]) {
  const definition = manifest.registeredQuestionGroups![0];
  const question: Question = {
    id: "chart",
    link_id: "chart",
    text: "Dental",
    type: "group",
    repeats: true,
    questions: definition.schema.map((child) => ({
      ...child,
      id: child.link_id,
      link_id: `chart__${child.link_id}`,
      questions: undefined,
    })),
  };
  const responses: Record<string, QuestionnaireResponse> = {
    chart: {
      question_id: "chart",
      link_id: "chart",
      structured_type: null,
      values: [],
      sub_results: values.map((values) =>
        question.questions!.map((child, index) => ({
          question_id: child.id,
          link_id: child.link_id,
          structured_type: null,
          values:
            values[index] === undefined
              ? []
              : [{ type: "string", value: values[index] }],
        })),
      ),
    },
  };
  const path = [{ questionId: "outer", rowIndex: 1 }];
  return {
    question,
    responses,
    path,
    validate: () => definition.validate!(question, responses, path),
  };
}

test("manifest validator accepts plain teeth and different findings on the same tooth", () => {
  assert.deepEqual(form([]).validate(), []);
  const fixture = form([["16"], ["21", "caries"], ["21", "mobile"]]);
  const before = structuredClone(fixture.responses);
  assert.deepEqual(fixture.validate(), []);
  assert.deepEqual(fixture.responses, before);
});

test("invalid choices target the child and duplicates target the chart", () => {
  for (const [values, field] of [
    [["99"], "tooth"],
    [["16", "bad"], "type"],
  ] as const) {
    const fixture = form([[...values]]);
    assert.equal(fixture.validate()[0].question_id, field);
    assert.deepEqual(fixture.validate()[0].response_path, [
      ...fixture.path,
      { questionId: "chart", rowIndex: 0 },
    ]);
  }
  for (const values of [
    [["16"], ["16"]],
    [
      ["16", "caries"],
      ["16", "caries"],
    ],
  ] as [string, string?][][]) {
    const fixture = form(values);
    assert.equal(fixture.validate()[0].question_id, "chart");
    assert.deepEqual(fixture.validate()[0].response_path, fixture.path);
  }
});

test("saved options and single-value cardinality are enforced", () => {
  const fixture = form([["16", "caries"]]);
  fixture.question.questions![1].answer_option = [{ value: "mobile" }];
  assert.equal(fixture.validate()[0].question_id, "type");
  const multiple = form([["16"]]);
  multiple.responses.chart.sub_results![0][0].values.push({
    type: "string",
    value: "21",
  });
  assert.equal(multiple.validate()[0].question_id, "tooth");
  const old = form([["16"]]);
  old.question.questions = old.question.questions!.slice(0, 1);
  assert.deepEqual(old.validate(), []);
});
