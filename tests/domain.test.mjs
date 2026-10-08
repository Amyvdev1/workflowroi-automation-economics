import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  calculate,
  compare,
  recommend,
  sensitivity,
  analyze,
  validateState,
} from "../src/domain.mjs";
import { makeReport } from "../src/report.mjs";
test("manual labor uses task minutes and hourly units", () => {
  const s = initialState();
  s.tasksPerWeek = 60;
  s.manualMinutes = 1;
  s.laborHourly = 30;
  s.manualError = 0;
  assert.equal(calculate(s, "manual").weeklyOperatingCost, 30);
});
test("zero volume gives zero costs and no payback claim", () => {
  const s = initialState();
  s.tasksPerWeek = 0;
  for (const r of compare(s)) {
    assert.equal(r.riskAdjustedWeeklyCost, 0);
    assert.equal(r.breakEvenWeeks, null);
  }
  assert.equal(recommend(compare(s)).mode, "manual");
});
test("zero costs never produce infinity or NaN", () => {
  const s = initialState();
  for (const key of Object.keys(s)) if (typeof s[key] === "number") s[key] = 0;
  const json = JSON.stringify(analyze(s));
  assert.ok(!json.includes("NaN"));
  assert.ok(!json.includes("Infinity"));
});
test("unknown model price cannot become zero", () => {
  const s = initialState();
  s.modelCost = null;
  assert.equal(calculate(s, "ai").weeklyOperatingCost, null);
  assert.equal(compare(s)[2].breakEvenWeeks, null);
});
test("high error loss can reject full automation", () => {
  const s = initialState();
  s.aiError = 1;
  s.partialError = 1;
  s.partialReview = 0;
  s.aiReview = 0;
  s.errorCost = 100000;
  assert.equal(recommend(compare(s)).mode, "manual");
});
test("adoption zero retains manual economics", () => {
  const s = initialState();
  s.adoption = 0;
  const rows = compare(s);
  assert.equal(rows[1].riskAdjustedWeeklyCost, rows[0].riskAdjustedWeeklyCost);
  assert.equal(rows[2].riskAdjustedWeeklyCost, rows[0].riskAdjustedWeeklyCost);
});
test("review reduces unresolved error losses while increasing review labor", () => {
  const s = initialState();
  s.aiReview = 0;
  const a = calculate(s, "ai");
  s.aiReview = 1;
  const b = calculate(s, "ai");
  assert.ok(b.expectedErrorLoss < a.expectedErrorLoss);
  assert.ok(b.laborCost > a.laborCost);
});
test("sensitivity rows reproduce independent comparisons", () => {
  const s = initialState();
  for (const row of sensitivity(s)) {
    assert.equal(
      row.recommendation,
      recommend(compare({ ...s, adoption: row.adoption / 100 })).mode,
    );
  }
});
test("report contains uncertainty, assumptions and forecast labels", () => {
  const s = initialState();
  s.confidence = "low";
  const r = analyze(s);
  const report = makeReport({ name: "WorkflowROI" }, r);
  assert.match(report, /low/);
  assert.match(report, /forecast/);
  assert.match(report, /reviewDetection/);
});
test("invalid fractions and negative rates are rejected", () => {
  const s = initialState();
  s.adoption = 1.1;
  assert.throws(() => validateState(s));
  s.adoption = 0.8;
  s.tasksPerWeek = -1;
  assert.throws(() => validateState(s));
});
test("unknown prices do not invent charges for zero executed tasks", () => {
  const s = initialState();
  s.modelCost = null;
  s.toolCost = null;
  s.tasksPerWeek = 0;
  assert.equal(calculate(s, "ai").weeklyOperatingCost, 0);
});
