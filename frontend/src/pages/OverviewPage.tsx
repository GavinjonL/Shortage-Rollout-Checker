import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FindingCard } from "../components/FindingCard";
import { StatusBadge } from "../components/StatusBadge";
import { importDemoTable } from "../api/client";
import { useDemo } from "../context/DemoContext";

export function OverviewPage() {
  const navigate = useNavigate();
  const { findings, confirmedRuleCount, isPolicyConfirmed, resetDemo, loadDemoData } = useDemo();
  const [lastReset, setLastReset] = useState("Ready for review");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [importTable, setImportTable] = useState("events");
  const [importMessage, setImportMessage] = useState("");
  const unresolvedCount = findings.filter((finding) => finding.review_status !== "Dismissed").length;
  async function reset() {
    setIsLoadingDemo(true);
    try { await resetDemo(); setLastReset("Data reset just now"); }
    catch (error) { setLastReset(error instanceof Error ? error.message : "Unable to reset data."); }
    finally { setIsLoadingDemo(false); }
  }
  async function loadDemo() {
    setIsLoadingDemo(true);
    try { await loadDemoData(); setLastReset("Data loaded just now"); }
    catch (error) { setLastReset(error instanceof Error ? error.message : "Unable to load data."); }
    finally { setIsLoadingDemo(false); }
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const result = await importDemoTable(importTable, file);
      setImportMessage(result.errors.length ? result.errors.map((error) => `Row ${error.row}, ${error.field}: ${error.message}`).join("; ") : `${result.imported_rows} rows imported. Use Load data to refresh the browser view.`);
    } catch (error) { setImportMessage(error instanceof Error ? error.message : "Unable to import data."); }
  }

  return <section className="dashboard-page landing-page">
    <section className="hero-panel" aria-labelledby="home-heading"><img src="/supply-workflow-hero-v3.png" alt="Abstract white, blue, and lilac workflow geometry" /><div className="hero-panel__overlay"><p className="eyebrow">Operations workspace</p><h1 id="home-heading">Review rollout, clearly.</h1><p>Draft. Confirm. Check.</p><div className="button-group"><button className="button button--primary" onClick={() => navigate("/policy")}>Review policy</button><button className="button button--quiet" onClick={() => navigate("/rollout")}>View findings</button></div></div><div className="hero-panel__caption"><span>Read-only workspace</span></div></section>
    <div className="demo-banner"><span aria-hidden="true">●</span><strong>Current data loaded</strong><span>{lastReset}. No live systems are connected.</span><button className="button button--secondary" onClick={reset}>Reset</button><button className="button button--primary" onClick={loadDemo} disabled={isLoadingDemo}>{isLoadingDemo ? "Loading…" : "Reload data"}</button></div>
    <section className="landing-intro"><p className="eyebrow">How it works</p><h2>Evidence first. People decide.</h2><p>Confirm policy rules, then review the results.</p></section>
    <section className="policy-summary" aria-labelledby="active-policy-heading"><div><p className="eyebrow">Active policy</p><h2 id="active-policy-heading">Orion shortage response</h2><p>Effective November 18, 2026 · {confirmedRuleCount} rules confirmed by a pharmacist persona</p></div><StatusBadge status={isPolicyConfirmed ? "Confirmed" : "Awaiting confirmation"} /></section>
    <section className="policy-summary" aria-labelledby="import-heading"><div><p className="eyebrow">Data import</p><h2 id="import-heading">Validate CSV or JSON rows</h2><p>Data records are validated before they are applied. Invalid files are not applied.</p></div><div className="button-group"><select aria-label="Data table to import" value={importTable} onChange={(event) => setImportTable(event.target.value)}><option value="events">Events</option><option value="medications">Medications</option><option value="departments">Departments</option><option value="configurations">Configurations</option><option value="inventory">Inventory</option><option value="alternatives">Alternatives</option><option value="test_cases">Test cases</option><option value="findings">Findings</option></select><input aria-label="CSV or JSON file" type="file" accept=".csv,.json,application/json,text/csv" onChange={(event) => void importFile(event.target.files?.[0])} /></div>{importMessage && <p role="status">{importMessage}</p>}</section>
    <section className="metric-grid" aria-label="Policy overview metrics"><article className="metric-card"><span>Open findings</span><strong>{unresolvedCount}</strong><p>Require human review</p></article><article className="metric-card"><span>Configured systems</span><strong>4</strong><p>Source records</p></article><article className="metric-card"><span>Policy rules</span><strong>{confirmedRuleCount}</strong><p>Confirmed for simulation</p></article></section>
    <section className="findings-section" aria-labelledby="findings-heading"><div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="findings-heading">Unresolved findings</h2></div><button className="button button--secondary" onClick={() => navigate("/rollout")}>View all findings</button></div><div className="finding-grid">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div></section>
  </section>;
}
