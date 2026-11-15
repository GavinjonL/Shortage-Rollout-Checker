import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FindingCard } from "../components/FindingCard";
import { StatusBadge } from "../components/StatusBadge";
import { useDemo } from "../context/DemoContext";

export function OverviewPage() {
  const navigate = useNavigate();
  const { findings, confirmedRuleCount, isPolicyConfirmed, resetDemo, loadDemoData } = useDemo();
  const [lastReset, setLastReset] = useState("Ready for review");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const unresolvedCount = findings.filter((finding) => finding.review_status !== "Dismissed").length;
  function reset() { resetDemo(); setLastReset("Demo data reset just now"); }
  async function loadDemo() {
    setIsLoadingDemo(true);
    try { await loadDemoData(); setLastReset("Fictional demo data loaded just now"); }
    catch (error) { setLastReset(error instanceof Error ? error.message : "Unable to load demo data."); }
    finally { setIsLoadingDemo(false); }
  }

  return <section className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Overview</p><h1>Policy rollout, in one view.</h1><p className="page-intro">Review fictional rollout evidence before it reaches hospital workflows.</p></div><div className="button-group"><button className="button button--secondary" onClick={reset}>Reset demo data</button><button className="button button--primary" onClick={loadDemo} disabled={isLoadingDemo}>{isLoadingDemo ? "Loading demo…" : "Load demo data"}</button></div></header>
    <div className="demo-banner"><span aria-hidden="true">●</span><strong>Demo data loaded</strong><span>{lastReset}. No live systems are connected.</span></div>
    <section className="policy-summary" aria-labelledby="active-policy-heading"><div><p className="eyebrow">Active policy</p><h2 id="active-policy-heading">Orion shortage response</h2><p>Effective November 18, 2026 · {confirmedRuleCount} rules confirmed by a pharmacist persona</p></div><StatusBadge status={isPolicyConfirmed ? "Confirmed" : "Awaiting confirmation"} /></section>
    <section className="metric-grid" aria-label="Policy overview metrics"><article className="metric-card"><span>Open findings</span><strong>{unresolvedCount}</strong><p>Require human review</p></article><article className="metric-card"><span>Configured systems</span><strong>4</strong><p>Mock source records</p></article><article className="metric-card"><span>Policy rules</span><strong>{confirmedRuleCount}</strong><p>Confirmed for simulation</p></article></section>
    <section className="findings-section" aria-labelledby="findings-heading"><div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="findings-heading">Unresolved findings</h2></div><button className="button button--secondary" onClick={() => navigate("/rollout")}>View all findings</button></div><div className="finding-grid">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div></section>
  </section>;
}
