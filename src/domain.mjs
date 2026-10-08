import { requireThat, number, text, clone, round, sum } from "./validation.mjs";
export const describe = {
  name: "WorkflowROI",
  slug: "workflowroi-automation-economics",
  port: 4314,
};
export function initialState() {
  return {
    name: "Developer issue routing",
    tasksPerWeek: 250,
    manualMinutes: 8,
    laborHourly: 32,
    modelCost: 0.06,
    toolCost: 0.02,
    partialReview: 0.45,
    aiReview: 0.18,
    reviewMinutes: 3,
    manualError: 0.015,
    partialError: 0.04,
    aiError: 0.09,
    reviewDetection: 0.9,
    errorCost: 80,
    implementationCost: 1800,
    maintenanceWeekly: 65,
    adoption: 0.8,
    confidence: "medium",
  };
}
export function validateState(value) {
  requireThat(
    value && typeof value === "object",
    "Workflow assumptions are required",
  );
  const s = clone(value);
  text(s.name, "Workflow name");
  for (const k of [
    "tasksPerWeek",
    "manualMinutes",
    "laborHourly",
    "reviewMinutes",
    "errorCost",
    "implementationCost",
    "maintenanceWeekly",
  ])
    number(s[k], k, { max: 1e7 });
  for (const k of ["modelCost", "toolCost"])
    number(s[k], k, { nullable: true });
  for (const k of [
    "partialReview",
    "aiReview",
    "manualError",
    "partialError",
    "aiError",
    "reviewDetection",
    "adoption",
  ])
    number(s[k], k, { max: 1 });
  requireThat(
    ["low", "medium", "high"].includes(s.confidence),
    "Confidence must be low, medium or high",
  );
  return s;
}
export function calculate(input, mode) {
  const s = validateState(input);
  requireThat(
    ["manual", "partial", "ai"].includes(mode),
    "Unknown operating mode",
  );
  const automated = mode === "manual" ? 0 : s.tasksPerWeek * s.adoption;
  const manual = s.tasksPerWeek - automated;
  const reviewFraction =
    mode === "partial" ? s.partialReview : mode === "ai" ? s.aiReview : 0;
  const reviewTasks = automated * reviewFraction;
  const labor = round(
    ((manual * s.manualMinutes + reviewTasks * s.reviewMinutes) *
      s.laborHourly) /
      60,
  );
  const automatedError =
    mode === "partial" ? s.partialError : mode === "ai" ? s.aiError : 0;
  const unresolvedErrors =
    manual * s.manualError +
    automated * automatedError * (1 - reviewFraction * s.reviewDetection);
  const errorLoss = round(unresolvedErrors * s.errorCost);
  const direct =
    automated === 0
      ? 0
      : s.toolCost === null || (mode === "ai" && s.modelCost === null)
        ? null
        : round(automated * (s.toolCost + (mode === "ai" ? s.modelCost : 0)));
  const maintenance =
    mode === "manual" || automated === 0
      ? 0
      : round(s.maintenanceWeekly * (mode === "ai" ? 1.5 : 1));
  const operating = sum([labor, direct, maintenance]);
  const riskAdjusted = sum([operating, errorLoss]);
  const implementation =
    mode === "manual" || automated === 0
      ? 0
      : round(s.implementationCost * (mode === "ai" ? 1.4 : 1));
  return {
    mode,
    weeklyTasks: s.tasksPerWeek,
    automatedTasks: round(automated),
    reviewHours: round((reviewTasks * s.reviewMinutes) / 60),
    laborCost: labor,
    modelToolCost: direct,
    maintenanceCost: maintenance,
    expectedUnresolvedErrors: round(unresolvedErrors),
    expectedErrorLoss: errorLoss,
    weeklyOperatingCost: operating,
    riskAdjustedWeeklyCost: riskAdjusted,
    implementationCost: implementation,
    basis: "forecast under user assumptions",
    confidence: s.confidence,
  };
}
export function compare(input) {
  const s = validateState(input),
    manual = calculate(s, "manual");
  return ["manual", "partial", "ai"].map((mode) => {
    const row = mode === "manual" ? manual : calculate(s, mode);
    const savings =
      row.riskAdjustedWeeklyCost === null
        ? null
        : round(manual.riskAdjustedWeeklyCost - row.riskAdjustedWeeklyCost);
    return {
      ...row,
      riskAdjustedWeeklySavings: savings,
      breakEvenWeeks:
        mode === "manual" || savings === null || savings <= 0
          ? null
          : row.implementationCost === 0
            ? 0
            : Math.ceil(row.implementationCost / savings),
      firstYearNetValue:
        savings === null ? null : round(savings * 52 - row.implementationCost),
    };
  });
}
export function recommend(rows) {
  const candidates = rows
    .filter(
      (r) =>
        r.mode !== "manual" &&
        r.riskAdjustedWeeklySavings !== null &&
        r.riskAdjustedWeeklySavings > 0,
    )
    .sort((a, b) => b.firstYearNetValue - a.firstYearNetValue);
  if (!candidates.length)
    return {
      mode: "manual",
      text: "Do not automate under the current assumptions. No modeled automated mode has positive risk-adjusted weekly savings. Measure review time, error frequency and error losses before reconsidering.",
    };
  const best = candidates[0];
  if (best.firstYearNetValue <= 0)
    return {
      mode: "manual",
      text: `Do not implement within a one-year decision horizon: ${best.mode} has weekly savings but does not recover its implementation cost within that horizon.`,
    };
  return {
    mode: best.mode,
    text: `Under the current assumptions, ${best.mode === "partial" ? "partial automation" : "AI-assisted automation"} reaches break-even after ${best.breakEvenWeeks} weeks and forecasts $${best.riskAdjustedWeeklySavings} in weekly risk-adjusted savings. Start with a measured pilot; this is a forecast, not a proven saving.`,
  };
}
export function sensitivity(s) {
  return [0.25, 0.5, 0.75, 1].map((adoption) => {
    const rows = compare({ ...s, adoption });
    const best = recommend(rows);
    const chosen = rows.find((r) => r.mode === best.mode);
    return {
      adoption: adoption * 100,
      recommendation: best.mode,
      weeklySavings: chosen.riskAdjustedWeeklySavings,
      breakEvenWeeks: chosen.breakEvenWeeks,
      basis: "forecast",
    };
  });
}
export function analyze(state) {
  const rows = compare(state),
    recommendation = recommend(rows),
    selected = rows.find((r) => r.mode === recommendation.mode);
  return {
    status: "forecast",
    boundary:
      "All economic results are forecasts under user-supplied assumptions. No production savings, error rates, adoption or labor time were measured.",
    metrics: [
      {
        label: "Recommended mode",
        value: recommendation.mode,
        basis: "one-year decision horizon",
      },
      {
        label: "Weekly savings",
        value: selected.riskAdjustedWeeklySavings,
        unit: "USD",
        basis: "risk-adjusted forecast",
      },
      {
        label: "Break-even",
        value: selected.breakEvenWeeks,
        unit: "weeks",
        basis:
          selected.breakEvenWeeks === null
            ? "not reached / not applicable"
            : "forecast",
      },
      {
        label: "Review workload",
        value: selected.reviewHours,
        unit: "hours/week",
        basis: "forecast",
      },
      {
        label: "First-year net value",
        value: selected.firstYearNetValue,
        unit: "USD",
        basis: "forecast",
      },
      {
        label: "Confidence",
        value: state.confidence,
        basis: "user-assigned, not calibrated",
      },
    ],
    table: rows,
    series: rows.map((r) => ({
      label: r.mode,
      value: r.riskAdjustedWeeklyCost,
    })),
    events: [],
    findings: [
      recommendation.text,
      "Risk-adjusted cost includes expected unresolved errors. Human review reduces errors only by the assumed detection rate.",
      `Adoption is ${round(state.adoption * 100)}%. Unadopted tasks retain manual labor and error costs.`,
      "Implementation is a one-time cost; maintenance is recurring. Zero-volume workflows have no implementation or maintenance charge.",
      "The highest-value next experiment is measuring actual review minutes and the cost of an unresolved error.",
    ],
    assumptions: {
      ...state,
      formulas: {
        labor:
          "(manual tasks × manual minutes + review tasks × review minutes) × hourly labor / 60",
        errors:
          "manual tasks × manual error probability + automated tasks × automated error probability × (1 − review fraction × detection)",
        riskAdjusted:
          "labor + model/tool + maintenance + expected error losses",
        breakEven:
          "ceil(implementation / positive risk-adjusted weekly savings)",
      },
      aiFactors:
        "AI implementation 1.4× and maintenance 1.5× the partial-automation assumptions",
    },
    sensitivity: sensitivity(state),
    errorSensitivity: [0.5, 1, 2, 4].map((multiplier) => ({
      errorCostMultiplier: multiplier,
      recommendation: recommend(
        compare({ ...state, errorCost: state.errorCost * multiplier }),
      ).mode,
    })),
  };
}
export function transact(current, payload) {
  requireThat(payload.kind === "simulate", "Supported operation: simulate");
  const state = validateState(payload.assumptions ?? current);
  return { state, result: analyze(state) };
}

export const validateReplacement = (next) => validateState(next);
