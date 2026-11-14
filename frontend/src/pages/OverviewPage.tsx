import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { demoFindings, activeDemoPolicy } from "../data/demoData";
import { FindingCard } from "../components/FindingCard";
import { StatusBadge } from "../components/StatusBadge";
import { useActivity } from "../context/ActivityContext";

export function OverviewPage() {
  const navigate = useNavigate();
  const { recordActivity } = useActivity();
  const [lastReset, setLastReset] = useState("Ready for review");
  const unresolvedCount = demoFindings.filter((finding) => finding.review_status !== "Dismissed").length;

  function resetDemo() {
    setLastReset("Demo data reset just now");
    recordActivity({ actor: "Demo user", feature: "Overview", action: "Reset demo data", target: "DEMO-01", detail: "Restored the fictional demo workspace state." });
  }

  return (
    <section className="dashboard-page">
      <header className="page-header">
        <div><p className="eyebrow">Overview</p><h1>Policy rollout, in one view.</h1><p className="page-intro">Review fictional rollout evidence before it reaches hospital workflows.</p></div>
        <button className="button button--primary" onClick={resetDemo}>Reset demo data</button>
      </header>
      <div className="demo-banner"><span aria-hidden="true">●</span><strong>Demo data loaded</strong><span>{lastReset}. No live systems are connected.</span></div>
      <section className="policy-summary" aria-labelledby="active-policy-heading">
        <div><p className="eyebrow">Active policy</p><h2 id="active-policy-heading">{activeDemoPolicy.name}</h2><p>Effective {activeDemoPolicy.effectiveDate} · {activeDemoPolicy.confirmedRules} rules confirmed by a pharmacist persona</p></div>
        <StatusBadge status={activeDemoPolicy.status} />
      </section>
      <section className="metric-grid" aria-label="Policy overview metrics">
        <article className="metric-card"><span>Open findings</span><strong>{unresolvedCount}</strong><p>Require human review</p></article>
        <article className="metric-card"><span>Configured systems</span><strong>4</strong><p>Mock source records</p></article>
        <article className="metric-card"><span>Policy rules</span><strong>{activeDemoPolicy.confirmedRules}</strong><p>Confirmed for simulation</p></article>
      </section>
      <section className="findings-section" aria-labelledby="findings-heading">
        <div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="findings-heading">Unresolved findings</h2></div><button className="button button--secondary" onClick={() => navigate("/rollout")}>View all findings</button></div>
        <div className="finding-grid">{demoFindings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div>
      </section>
    </section>
  );
}
