import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CHART_ROWS,
  TEETH,
  formatToothNumber,
  isFdiCode,
  quadrantTeeth,
  sortFdi,
  toothByFdi,
} from "./teeth";

test("the dentition has 32 permanent and 20 primary teeth, all unique", () => {
  assert.equal(TEETH.length, 52);
  assert.equal(new Set(TEETH.map((t) => t.fdi)).size, 52);
  assert.equal(TEETH.filter((t) => t.dentition === "permanent").length, 32);
  assert.equal(TEETH.filter((t) => t.dentition === "primary").length, 20);
  assert.equal(new Set(TEETH.map((t) => t.universal)).size, 52);
});

test("FDI codes carry quadrant, side, arch and anatomical name", () => {
  const tooth = toothByFdi("16");
  assert.ok(tooth);
  assert.equal(tooth.quadrant, 1);
  assert.equal(tooth.position, 6);
  assert.equal(tooth.arch, "upper");
  assert.equal(tooth.side, "right");
  assert.equal(tooth.dentition, "permanent");
  assert.equal(tooth.toothClass, "molar");
  assert.equal(tooth.nameKey, "tooth_first_molar");

  const primary = toothByFdi("74");
  assert.ok(primary);
  assert.equal(primary.arch, "lower");
  assert.equal(primary.side, "left");
  assert.equal(primary.dentition, "primary");
  assert.equal(primary.nameKey, "tooth_first_molar");
  assert.equal(primary.toothClass, "molar");
});

test("universal numbering matches the ADA convention at every corner", () => {
  const universal = (fdi: string) =>
    formatToothNumber(toothByFdi(fdi)!, "universal");
  assert.equal(universal("18"), "1");
  assert.equal(universal("11"), "8");
  assert.equal(universal("21"), "9");
  assert.equal(universal("28"), "16");
  assert.equal(universal("38"), "17");
  assert.equal(universal("31"), "24");
  assert.equal(universal("41"), "25");
  assert.equal(universal("48"), "32");
  assert.equal(universal("55"), "A");
  assert.equal(universal("51"), "E");
  assert.equal(universal("61"), "F");
  assert.equal(universal("65"), "J");
  assert.equal(universal("75"), "K");
  assert.equal(universal("71"), "O");
  assert.equal(universal("81"), "P");
  assert.equal(universal("85"), "T");
  assert.equal(formatToothNumber(toothByFdi("16")!, "fdi"), "16");
});

test("chart rows run from the patient's right to left, primary rows inside", () => {
  const codes = (row: readonly { fdi: string }[]) => row.map((t) => t.fdi);
  assert.deepEqual(codes(CHART_ROWS.upperPermanent).slice(0, 3), [
    "18",
    "17",
    "16",
  ]);
  assert.deepEqual(codes(CHART_ROWS.upperPermanent).slice(7, 9), ["11", "21"]);
  assert.deepEqual(codes(CHART_ROWS.upperPermanent).at(-1), "28");
  assert.deepEqual(codes(CHART_ROWS.lowerPermanent)[0], "48");
  assert.deepEqual(codes(CHART_ROWS.lowerPermanent).at(-1), "38");
  assert.deepEqual(codes(CHART_ROWS.upperPrimary), [
    "55",
    "54",
    "53",
    "52",
    "51",
    "61",
    "62",
    "63",
    "64",
    "65",
  ]);
  assert.deepEqual(codes(CHART_ROWS.lowerPrimary), [
    "85",
    "84",
    "83",
    "82",
    "81",
    "71",
    "72",
    "73",
    "74",
    "75",
  ]);
});

test("quadrant lookups, code validation and numeric sorting", () => {
  assert.equal(quadrantTeeth(3).length, 8);
  assert.equal(quadrantTeeth(7).length, 5);
  assert.ok(isFdiCode("48"));
  assert.ok(!isFdiCode("49"));
  assert.ok(!isFdiCode("19"));
  assert.ok(!isFdiCode(16));
  assert.ok(!isFdiCode("56"));
  assert.deepEqual(sortFdi(["48", "11", "26", "16", "55"]), [
    "11",
    "16",
    "26",
    "48",
    "55",
  ]);
});
