import React from "react";
import { Field, Select, Table } from "./components.jsx";
export function Workspace({ state, setState, action, save, busy }) {
  const update = (k, v) => setState({ ...state, [k]: v });
  const numeric = [
    ["tasksPerWeek", "Tasks per week"],
    ["manualMinutes", "Manual time · minutes / task"],
    ["laborHourly", "Labor assumption · USD / hour"],
    ["modelCost", "AI model · USD / automated task"],
    ["toolCost", "Tool cost · USD / automated task"],
    ["reviewMinutes", "Review time · minutes"],
    ["errorCost", "Unresolved error · USD"],
    ["implementationCost", "Implementation · USD"],
    ["maintenanceWeekly", "Maintenance · USD / week"],
  ];
  const fractions = [
    ["adoption", "Expected adoption"],
    ["partialReview", "Partial automation · review fraction"],
    ["aiReview", "AI mode · review fraction"],
    ["manualError", "Manual error probability"],
    ["partialError", "Partial error probability"],
    ["aiError", "AI error probability"],
    ["reviewDetection", "Review detection probability"],
  ];
  return (
    <section className="panel">
      <h2>Assumptions studio</h2>
      <p className="hint">
        Change the inputs. Watch the recommendation earn its place.
      </p>
      <div className="fields">
        <Field
          label="Workflow"
          value={state.name}
          onChange={(v) => update("name", v)}
        />
        {numeric.map(([k, label]) => (
          <Field
            key={k}
            label={label}
            type="number"
            min="0"
            step="any"
            value={state[k]}
            onChange={(v) => update(k, v)}
          />
        ))}
        <details>
          <summary className="key">
            Review, error and adoption assumptions
          </summary>
          <div className="fields" style={{ marginTop: 16 }}>
            {fractions.map(([k, label]) => (
              <Field
                key={k}
                label={`${label} · 0–1`}
                type="number"
                min="0"
                max="1"
                step=".01"
                value={state[k]}
                onChange={(v) => update(k, v)}
              />
            ))}
          </div>
        </details>
        <Select
          label="Confidence in these estimates"
          value={state.confidence}
          onChange={(v) => update("confidence", v)}
          options={["low", "medium", "high"]}
        />
        <button
          className="primary full"
          disabled={busy}
          onClick={() => action({ kind: "simulate", assumptions: state })}
        >
          Compare operating modes →
        </button>
        <button className="secondary" disabled={busy} onClick={save}>
          Save assumptions
        </button>
      </div>
    </section>
  );
}
export function Extra(run) {
  return (
    <section className="panel">
      <h2>Where the decision changes</h2>
      <p className="hint">
        Adoption and failure cost are varied independently; other assumptions
        stay fixed.
      </p>
      <Table rows={run.sensitivity} />
      <h3>Error-loss sensitivity</h3>
      <Table rows={run.errorSensitivity} />
    </section>
  );
}
