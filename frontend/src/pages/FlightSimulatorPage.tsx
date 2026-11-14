import { useState } from "react";

type ResultStatus = "Pass" | "Possible mismatch" | "Needs clarification";

interface TestCase {
  id: string;
  title: string;
  department: string;
  scenario: string;
  expected: string;
  observed: string;
  ruleId: string;
  evidence: string;
  status: ResultStatus;
}

const testCases: TestCase[] = [
  {
    id: "TC-01",
    title: "Eligible adult oral alternative",
    department: "Emergency Department",
    scenario: "IV Orion stock is below the shortage threshold. Adult patient can take oral medication.",
    expected: "The approved oral alternative is shown for the new order.",
    observed: "Approved oral alternative displayed.",
    ruleId: "POL-01",
    evidence: "Sample order ORD-442 · EHR configuration EHR-201",
    status: "Pass",
  },
  {
    id: "TC-02",
    title: "Contraindicated oral alternative",
    department: "Infusion Center",
    scenario: "IV Orion stock is below the shortage threshold. Oral administration is contraindicated.",
    expected: "No oral shortage substitution is offered.",
    observed: "Order set still displays the oral alternative without a contraindication check.",
    ruleId: "POL-02",
    evidence: "Sample order ORD-447 · EHR configuration EHR-204",
    status: "Possible mismatch",
  },
  {
    id: "TC-03",
    title: "Shortage condition not supplied",
    department: "Medical Surgical",
    scenario: "Adult order contains no current inventory status or shortage-threshold indicator.",
    expected: "Do not infer whether the shortage policy applies.",
    observed: "Required condition is missing from the supplied sample data.",
    ruleId: "POL-03",
    evidence: "Sample order ORD-451 · Inventory status omitted",
    status: "Needs clarification",
  },
];

function statusClass(status: ResultStatus) {
  return status.toLowerCase().replace(/ /g, "-");
}

export function FlightSimulatorPage() {
  const [selectedId, setSelectedId] = useState(testCases[0].id);
  const [hasRun, setHasRun] = useState(false);
  const selectedCase = testCases.find((testCase) => testCase.id === selectedId) ?? testCases[0];

  function selectCase(id: string) {
    setSelectedId(id);
    setHasRun(false);
  }

  return <section className="simulator-page" aria-labelledby="simulator-title">
    <div className="page-heading">
      <div>
        <p className="eyebrow">Shortage Flight Simulator</p>
        <h1 id="simulator-title">Test a sample order before rollout</h1>
        <p className="page-intro">Compare supplied fictional orders against confirmed shortage-policy rules. This prototype never sends, changes, or blocks a live order.</p>
      </div>
      <div className="simulation-label">Simulation only · Demo data</div>
    </div>

    <div className="simulation-banner" role="note"><strong>Review-only result.</strong> These deterministic checks use supplied sample data and do not provide a clinical recommendation.</div>

    <div className="simulator-layout">
      <aside className="test-case-list" aria-label="Sample test cases">
        <div className="case-list-heading"><p className="step-label">Sample cases</p><h2>Choose an order</h2></div>
        {testCases.map((testCase) => <button className={`test-case-option ${testCase.id === selectedId ? "is-selected" : ""}`} type="button" key={testCase.id} onClick={() => selectCase(testCase.id)}>
          <span className="test-case-option__id">{testCase.id}</span>
          <strong>{testCase.title}</strong>
          <span>{testCase.department}</span>
          <em className={`result-dot result-dot--${statusClass(testCase.status)}`}>{testCase.status}</em>
        </button>)}
      </aside>

      <article className="simulation-workspace">
        <div className="card-heading"><div><p className="step-label">Selected scenario</p><h2>{selectedCase.title}</h2></div><button className="primary-button" type="button" onClick={() => setHasRun(true)}>Run simulation</button></div>
        <div className="scenario-facts"><div><span>Department</span><strong>{selectedCase.department}</strong></div><div><span>Policy rule</span><strong>{selectedCase.ruleId}</strong></div><div><span>Source</span><strong>Supplied sample order</strong></div></div>
        <section className="scenario-panel" aria-labelledby="scenario-input-title"><p className="step-label" id="scenario-input-title">Order conditions</p><p>{selectedCase.scenario}</p></section>

        {!hasRun ? <div className="run-placeholder"><span>▸</span><div><strong>Ready to run</strong><p>Run this case to compare the sample order with the confirmed policy rule.</p></div></div> : <section className="simulation-result" aria-live="polite">
          <div className="result-heading"><div><p className="step-label">Simulation result</p><h2>{selectedCase.status}</h2></div><span className={`result-badge result-badge--${statusClass(selectedCase.status)}`}>{selectedCase.status}</span></div>
          <div className="result-comparison"><div><span>Expected policy behavior</span><p>{selectedCase.expected}</p></div><div><span>Observed sample behavior</span><p>{selectedCase.observed}</p></div></div>
          <div className="result-evidence"><span>Evidence</span><strong>{selectedCase.evidence}</strong><button className="text-button" type="button">View evidence details</button></div>
        </section>}
      </article>
    </div>
  </section>;
}
