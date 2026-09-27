import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  GroupInputProps,
  GroupRow,
  QuestionnaireResponse,
} from "../types/host";
import {
  TOOTH_CHART_SCHEMA,
  chartEntries,
  chartTeeth,
  toothIsEditable,
  updateChartRows,
} from "./group";

type Updates = Record<string, Partial<QuestionnaireResponse>>;
function fieldsFor(tooth?: string, type?: string): GroupInputProps["fields"] {
  return Object.fromEntries(
    TOOTH_CHART_SCHEMA.map((definition) => {
      const key = definition.link_id;
      const value = key === "tooth" ? tooth : type;
      return [
        key,
        {
          question: { ...definition, id: key, questions: undefined },
          response: {
            question_id: key,
            link_id: key,
            structured_type: null,
            values: value ? [{ type: "string", value }] : [],
          },
          disabled: false,
          hidden: false,
          errors: [],
        },
      ];
    }),
  );
}
function harness(initial: [string, string?][]) {
  let rows: GroupRow[] = [];
  const addRow = (updates: Updates = {}) => {
    const row: GroupRow = {
      fields: fieldsFor(),
      onChange: (patches) => {
        for (const [key, patch] of Object.entries(patches)) {
          const field = row.fields[key];
          if (field) field.response = { ...field.response, ...patch };
        }
      },
      remove: () => {
        rows = rows.filter((current) => current !== row);
      },
    };
    row.onChange(updates);
    rows.push(row);
  };
  for (const [tooth, type] of initial)
    addRow({
      tooth: { values: [{ type: "string", value: tooth }] },
      type: { values: type ? [{ type: "string", value: type }] : [] },
    });
  return {
    get rows() {
      return rows;
    },
    addRow,
  };
}

test("the row schema contains only a required tooth and a single optional finding", () => {
  assert.deepEqual(
    TOOTH_CHART_SCHEMA.map(({ link_id, type, required, repeats }) => ({
      link_id,
      type,
      required,
      repeats,
    })),
    [
      { link_id: "tooth", type: "choice", required: true, repeats: undefined },
      {
        link_id: "type",
        type: "choice",
        required: undefined,
        repeats: undefined,
      },
    ],
  );
  assert.equal(chartTeeth(fieldsFor()).length, 52);
});

test("findings on the same tooth occupy separate rows and replace a plain selection", () => {
  const state = harness([["11"]]);
  const first = state.rows[0];
  updateChartRows(
    fieldsFor(),
    state.rows,
    [{ tooth: "11", marks: ["caries", "mobile"] }, { tooth: "21" }],
    state.addRow,
  );
  assert.equal(state.rows.length, 3);
  assert.equal(state.rows[0], first);
  assert.deepEqual(chartEntries(state.rows), [
    { tooth: "11", marks: ["caries", "mobile"] },
    { tooth: "21" },
  ]);
  assert.ok(
    state.rows.every(({ fields }) => fields.type!.response.values.length <= 1),
  );
  updateChartRows(
    fieldsFor(),
    state.rows,
    [{ tooth: "11", marks: ["mobile"] }],
    state.addRow,
  );
  assert.equal(state.rows.length, 1);
  assert.deepEqual(chartEntries(state.rows), [
    { tooth: "11", marks: ["mobile"] },
  ]);
  updateChartRows(fieldsFor(), state.rows, [], state.addRow);
  assert.equal(state.rows.length, 0);
});

test("nullable finding bindings retain tooth selection without writing a missing child", () => {
  const fields = fieldsFor();
  fields.type = null;
  const state = harness([["11"]]);
  state.rows[0].fields.type = null;
  assert.equal(toothIsEditable(fields, state.rows, "11"), true);
  assert.equal(toothIsEditable(fields, state.rows, "11", "caries"), false);
  const added: Updates[] = [];
  updateChartRows(
    fields,
    state.rows,
    [{ tooth: "11" }, { tooth: "21" }],
    (updates = {}) => added.push(updates),
  );
  assert.deepEqual(added, [
    { tooth: { values: [{ type: "string", value: "21" }] } },
  ]);
  state.rows[0].fields.tooth!.disabled = true;
  updateChartRows(fields, state.rows, [], state.addRow);
  assert.equal(state.rows.length, 1);
  fields.tooth = null;
  assert.deepEqual(chartTeeth(fields), []);
});

test("drag commits do not re-add earlier teeth before row props refresh", () => {
  const added: Updates[] = [];
  const fields = fieldsFor();
  const first = [{ tooth: "11", marks: ["caries"] }];
  const next = [...first, { tooth: "12", marks: ["caries"] }];
  updateChartRows(fields, [], first, (updates = {}) => added.push(updates), []);
  updateChartRows(
    fields,
    [],
    next,
    (updates = {}) => added.push(updates),
    first,
  );
  assert.equal(added.length, 2);
  assert.deepEqual(
    added.map((row) => row.tooth.values?.[0].value),
    ["11", "12"],
  );
});
