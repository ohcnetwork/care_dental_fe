import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyBrush,
  applyBrushToMany,
  brushCovers,
  brushOpFor,
  inferDentition,
  parseEntries,
  primaryMark,
  removeMark,
  removeTooth,
  summarize,
} from "./chart";

test("parseEntries keeps valid teeth, merges duplicates and orders marks", () => {
  const parsed = parseEntries([
    { tooth: "26", marks: ["mobile", "caries", "caries"] },
    { tooth: "16" },
    { tooth: "99", marks: ["caries"] },
    { tooth: 16 },
    "16",
    null,
    { tooth: "26", marks: ["filled", 4, ""] },
  ]);
  assert.deepEqual(parsed, [
    { tooth: "16" },
    { tooth: "26", marks: ["caries", "filled", "mobile"] },
  ]);
  assert.deepEqual(parseEntries(undefined), []);
  assert.deepEqual(parseEntries("nope"), []);
});

test("the select brush involves a tooth and removes it outright", () => {
  let entries = applyBrush([], "11", "select");
  assert.deepEqual(entries, [{ tooth: "11" }]);
  entries = applyBrush(entries, "11", "caries");
  assert.deepEqual(entries, [{ tooth: "11", marks: ["caries"] }]);
  entries = applyBrush(entries, "11", "select");
  assert.deepEqual(entries, []);
});

test("a marker brush toggles the finding; the last finding removes the tooth", () => {
  let entries = applyBrush([], "36", "caries");
  assert.deepEqual(entries, [{ tooth: "36", marks: ["caries"] }]);
  entries = applyBrush(entries, "36", "mobile");
  assert.deepEqual(entries, [{ tooth: "36", marks: ["caries", "mobile"] }]);
  assert.equal(primaryMark(entries[0]), "caries");
  entries = applyBrush(entries, "36", "caries");
  assert.deepEqual(entries, [{ tooth: "36", marks: ["mobile"] }]);
  entries = applyBrush(entries, "36", "mobile");
  assert.deepEqual(entries, []);
});

test("brushOpFor predicts the direction of the next tap", () => {
  const entries = [{ tooth: "21", marks: ["filled"] }, { tooth: "22" }];
  assert.equal(brushOpFor(entries, "21", "select"), "remove");
  assert.equal(brushOpFor(entries, "21", "filled"), "remove");
  assert.equal(brushOpFor(entries, "21", "caries"), "add");
  assert.equal(brushOpFor(entries, "22", "caries"), "add");
  assert.equal(brushOpFor(entries, "23", "select"), "add");
});

test("a forced op is idempotent, so painting never flickers", () => {
  const once = applyBrush([{ tooth: "11" }], "11", "select", "add");
  assert.deepEqual(once, [{ tooth: "11" }]);
  const marked = applyBrush(
    [{ tooth: "11", marks: ["caries"] }],
    "11",
    "caries",
    "add",
  );
  assert.deepEqual(marked, [{ tooth: "11", marks: ["caries"] }]);
  const gone = applyBrush([], "11", "caries", "remove");
  assert.deepEqual(gone, []);
});

test("unknown teeth are ignored and entries stay sorted", () => {
  const entries = applyBrushToMany(
    [],
    ["48", "11", "xx", "26"],
    "select",
    "add",
  );
  assert.deepEqual(entries, [
    { tooth: "11" },
    { tooth: "26" },
    { tooth: "48" },
  ]);
  assert.ok(brushCovers(entries, ["11", "48"], "select"));
  assert.ok(!brushCovers(entries, ["11", "12"], "select"));
  assert.deepEqual(
    applyBrushToMany(entries, ["11", "26"], "select", "remove"),
    [{ tooth: "48" }],
  );
});

test("removeTooth / removeMark", () => {
  const entries = [
    { tooth: "11", marks: ["caries", "mobile"] },
    { tooth: "12" },
  ];
  assert.deepEqual(removeTooth(entries, "12"), [
    { tooth: "11", marks: ["caries", "mobile"] },
  ]);
  assert.deepEqual(removeMark(entries, "11", "caries"), [
    { tooth: "11", marks: ["mobile"] },
    { tooth: "12" },
  ]);
  assert.deepEqual(removeMark(entries, "11", "filled"), entries);
});

test("summarize groups by finding in legend order, plain selections last", () => {
  const entries = parseEntries([
    { tooth: "11" },
    { tooth: "16", marks: ["mobile", "caries"] },
    { tooth: "26", marks: ["caries"] },
    { tooth: "36", marks: ["missing"] },
    { tooth: "46", marks: ["zzz_future"] },
  ]);
  assert.deepEqual(summarize(entries), [
    { mark: "caries", teeth: ["16", "26"] },
    { mark: "missing", teeth: ["36"] },
    { mark: "mobile", teeth: ["16"] },
    { mark: "zzz_future", teeth: ["46"] },
    { mark: null, teeth: ["11"] },
  ]);
  assert.deepEqual(summarize([]), []);
});

test("inferDentition reads the rows the data needs", () => {
  assert.equal(inferDentition([]), undefined);
  assert.equal(inferDentition([{ tooth: "11" }]), "permanent");
  assert.equal(inferDentition([{ tooth: "51" }]), "primary");
  assert.equal(inferDentition([{ tooth: "51" }, { tooth: "16" }]), "mixed");
});
