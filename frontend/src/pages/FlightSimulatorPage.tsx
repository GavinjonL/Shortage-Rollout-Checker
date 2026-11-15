import { useEffect, useState } from "react";
import { fetchSimulationCases, runSimulationCase, type SimulationResult, type SimulatorCase } from "../api/client";
import { useActivity } from "../context/ActivityContext";
import { useDemo } from "../context/DemoContext";
import { PolicyConfirmationGate } from "../components/PolicyConfirmationGate";
import { StatePanel } from "../components/StatePanel";

function statusClass(status: string) { return status.toLowerCase().replace(/ /g, "-"); }

export function FlightSimulatorPage() {
  const { recordActivity } = useActivity();
  const { isPolicyConfirmed } = useDemo();
  const [cases, setCases] = useState<SimulatorCase[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [instructionText, setInstructionText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    fetchSimulationCases().then((loadedCases) => {
      setCases(loadedCases);
      const first = loadedCases[0];
      if (first) { setSelectedId(first.test_case.id); setInstructionText(first.configuration?.instruction_text ?? ""); }
    }).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load simulation cases.")).finally(() => setIsLoading(false));
  }, []);

  const selected = cases.find((item) => item.test_case.id === selectedId) ?? cases[0];
  function selectCase(next: SimulatorCase) {
    setSelectedId(next.test_case.id); setInstructionText(next.configuration?.instruction_text ?? ""); setResult(null); setShowEvidence(false); setError("");
  }
  async function runSimulation() {
    if (!selected) return;
    setIsRunning(true); setError("");
    try {
      const nextResult = await runSimulationCase(selected.test_case.id, selected.configuration ? instructionText : null);
      setResult(nextResult);
      recordActivity({ actor: "Reviewer", feature: "Flight Simulator", action: "Ran case", target: selected.test_case.id, detail: `Simulation result: ${nextResult.status}.` });
    } catch (runError) { setError(runError instanceof Error ? runError.message : "Unable to run simulation."); }
    finally { setIsRunning(false); }
  }

  if (!isPolicyConfirmed) return <PolicyConfirmationGate feature="The Flight Simulator" />;
  if (isLoading) return <StatePanel kind="loading" title="Loading cases" message="Retrieving read-only simulation data." />;
  if (error) return <StatePanel kind="error" title="Simulation data unavailable" message={error} />;
  if (!selected) return <StatePanel kind="empty" title="No cases available" message="Load or reset policy data, then try again." />;
  return <section className="simulator-page" aria-labelledby="simulator-title">
    <div className="page-heading"><div><p className="eyebrow">Flight Simulator</p><h1 id="simulator-title">Review orders</h1><p className="page-intro">Compare orders with confirmed rules.</p></div><div className="simulation-label">Review only</div></div>
    <div className="simulation-banner" role="note"><strong>Review-only result.</strong> These deterministic checks use supplied data and do not provide a clinical recommendation.</div>
    {isLoading && <p className="inline-notice" role="status">Loading cases…</p>}
    {error && <p className="inline-notice" role="alert">{error}</p>}
    {!isLoading && selected && <div className="simulator-layout">
      <aside className="test-case-list" aria-label="Policy test cases"><div className="case-list-heading"><p className="step-label">Validated cases</p><h2>Choose an order</h2></div>{cases.map((item) => <button className={`test-case-option ${item.test_case.id === selected.test_case.id ? "is-selected" : ""}`} type="button" key={item.test_case.id} onClick={() => selectCase(item)}><span className="test-case-option__id">{item.test_case.id}</span><strong>{item.test_case.title}</strong><span>{item.test_case.department_id}</span></button>)}</aside>
      <article className="simulation-workspace"><div className="card-heading"><div><p className="step-label">Selected scenario</p><h2>{selected.test_case.title}</h2></div><button className="primary-button" type="button" onClick={runSimulation} disabled={isRunning}>{isRunning ? "Running…" : result ? "Rerun simulation" : "Run simulation"}</button></div>
        <div className="scenario-facts"><div><span>Department</span><strong>{selected.test_case.department_id}</strong></div><div><span>Policy rule</span><strong>{selected.test_case.source_rule_id}</strong></div><div><span>Source</span><strong>Validated order</strong></div></div>
        <section className="scenario-panel"><p className="step-label">Order conditions</p><p>{selected.test_case.scenario_text}</p></section>
        {selected.configuration && <section className="scenario-panel"><p className="step-label">Configuration adjustment</p><label htmlFor="configuration-text">Instruction text<textarea id="configuration-text" value={instructionText} onChange={(event) => { setInstructionText(event.target.value); setResult(null); }} rows={3} /></label><p className="field-help">Edit this record, then rerun to compare its result. It is never saved to a hospital system.</p></section>}
        {!result ? <div className="run-placeholder"><span>▸</span><div><strong>Ready to run</strong><p>Run this validated case to compare the order with the confirmed policy rule.</p></div></div> : <section className="simulation-result" aria-live="polite"><div className="result-heading"><div><p className="step-label">Simulation result</p><h2>{result.status}</h2></div><span className={`result-badge result-badge--${statusClass(result.status)}`}>{result.status}</span></div><div className="result-comparison"><div><span>Expected policy behavior</span><p>{result.expected_outcome}</p></div><div><span>Observed sample behavior</span><p>{result.observed_behavior}</p></div></div><div className="result-evidence"><span>Reason</span><strong>{result.reason}</strong><p>Evidence: {result.evidence_ids.join(" · ")}</p><button className="text-button" type="button" onClick={() => setShowEvidence((visible) => !visible)}>{showEvidence ? "Hide assumptions" : "View assumptions"}</button>{showEvidence && <p className="evidence-detail-text">{result.assumptions.join(" · ")}</p>}</div></section>}
      </article>
    </div>}
  </section>;
}
