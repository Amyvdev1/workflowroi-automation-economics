# WorkflowROI — decision report

Recorded: test fixture
Operation: scenario

## Evidence boundary

All economic results are forecasts under user-supplied assumptions. No production savings, error rates, adoption or labor time were measured.

## Results

- **Recommended mode:** partial  (one-year decision horizon)
- **Weekly savings:** 499.5334 USD (risk-adjusted forecast)
- **Break-even:** 4 weeks (forecast)
- **Review workload:** 4.5 hours/week (forecast)
- **First-year net value:** 24175.7368 USD (forecast)
- **Confidence:** medium  (user-assigned, not calibrated)

## Findings

- Under the current assumptions, partial automation reaches break-even after 4 weeks and forecasts $499.5334 in weekly risk-adjusted savings. Start with a measured pilot; this is a forecast, not a proven saving.
- Risk-adjusted cost includes expected unresolved errors. Human review reduces errors only by the assumed detection rate.
- Adoption is 80%. Unadopted tasks retain manual labor and error costs.
- Implementation is a one-time cost; maintenance is recurring. Zero-volume workflows have no implementation or maintenance charge.
- The highest-value next experiment is measuring actual review minutes and the cost of an unresolved error.

## Inputs and assumptions

```json
{
  "name": "Developer issue routing",
  "tasksPerWeek": 250,
  "manualMinutes": 8,
  "laborHourly": 32,
  "modelCost": 0.06,
  "toolCost": 0.02,
  "partialReview": 0.45,
  "aiReview": 0.18,
  "reviewMinutes": 3,
  "manualError": 0.015,
  "partialError": 0.04,
  "aiError": 0.09,
  "reviewDetection": 0.9,
  "errorCost": 80,
  "implementationCost": 1800,
  "maintenanceWeekly": 65,
  "adoption": 0.8,
  "confidence": "medium",
  "formulas": {
    "labor": "(manual tasks × manual minutes + review tasks × review minutes) × hourly labor / 60",
    "errors": "manual tasks × manual error probability + automated tasks × automated error probability × (1 − review fraction × detection)",
    "riskAdjusted": "labor + model/tool + maintenance + expected error losses",
    "breakEven": "ceil(implementation / positive risk-adjusted weekly savings)"
  },
  "aiFactors": "AI implementation 1.4× and maintenance 1.5× the partial-automation assumptions"
}
```

## Inspectable records

```json
[
  {
    "mode": "manual",
    "weeklyTasks": 250,
    "automatedTasks": 0,
    "reviewHours": 0,
    "laborCost": 1066.6667,
    "modelToolCost": 0,
    "maintenanceCost": 0,
    "expectedUnresolvedErrors": 3.75,
    "expectedErrorLoss": 300,
    "weeklyOperatingCost": 1066.6667,
    "riskAdjustedWeeklyCost": 1366.6667,
    "implementationCost": 0,
    "basis": "forecast under user assumptions",
    "confidence": "medium",
    "riskAdjustedWeeklySavings": 0,
    "breakEvenWeeks": null,
    "firstYearNetValue": 0
  },
  {
    "mode": "partial",
    "weeklyTasks": 250,
    "automatedTasks": 200,
    "reviewHours": 4.5,
    "laborCost": 357.3333,
    "modelToolCost": 4,
    "maintenanceCost": 65,
    "expectedUnresolvedErrors": 5.51,
    "expectedErrorLoss": 440.8,
    "weeklyOperatingCost": 426.3333,
    "riskAdjustedWeeklyCost": 867.1333,
    "implementationCost": 1800,
    "basis": "forecast under user assumptions",
    "confidence": "medium",
    "riskAdjustedWeeklySavings": 499.5334,
    "breakEvenWeeks": 4,
    "firstYearNetValue": 24175.7368
  },
  {
    "mode": "ai",
    "weeklyTasks": 250,
    "automatedTasks": 200,
    "reviewHours": 1.8,
    "laborCost": 270.9333,
    "modelToolCost": 16,
    "maintenanceCost": 97.5,
    "expectedUnresolvedErrors": 15.834,
    "expectedErrorLoss": 1266.72,
    "weeklyOperatingCost": 384.4333,
    "riskAdjustedWeeklyCost": 1651.1533,
    "implementationCost": 2520,
    "basis": "forecast under user assumptions",
    "confidence": "medium",
    "riskAdjustedWeeklySavings": -284.4866,
    "breakEvenWeeks": null,
    "firstYearNetValue": -17313.3032
  }
]
```

## Execution measurement

Local calculation duration: not measured ms. This measures local processing, not model, tool, human or production latency.
