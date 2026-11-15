import { useNavigate } from "react-router-dom";
import { FindingCard } from "../components/FindingCard";
import { StatusBadge } from "../components/StatusBadge";
import { useDemo } from "../context/DemoContext";

export function OverviewPage() {
  const navigate = useNavigate();
  const { findings, confirmedRuleCount, isPolicyConfirmed, clearWorkspace } = useDemo();
  const unresolvedCount = findings.filter((finding) => finding.review_status !== "Dismissed").length;
  return <section className="dashboard-page landing-page">
    <section className="hero-panel" aria-labelledby="home-heading"><img src="/supply-workflow-hero-v3.png" alt="Abstract white, blue, and lilac workflow geometry" /><div className="hero-panel__overlay"><p className="eyebrow">Policy workspace</p><h1 id="home-heading">Review rollout, clearly.</h1><p>Enter. Confirm. Check.</p><div className="button-group"><button className="button button--primary" onClick={() => navigate("/policy")}>Enter policy</button><button className="button button--quiet" onClick={() => navigate("/rollout")}>View findings</button></div></div><div className="hero-panel__caption"><span>Local workspace</span></div></section>
    <section className="landing-intro"><p className="eyebrow">How it works</p><h2>Evidence first. People decide.</h2><p>Enter and confirm policy rules, then review records and findings when they are available.</p></section>
    <section className="policy-summary" aria-labelledby="active-policy-heading"><div><p className="eyebrow">Policy status</p><h2 id="active-policy-heading">Manual policy setup</h2><p>{confirmedRuleCount} rules confirmed in this browser session</p></div><StatusBadge status={isPolicyConfirmed ? "Confirmed" : "Awaiting confirmation"} /></section>
    <section className="metric-grid" aria-label="Policy overview metrics"><article className="metric-card"><span>Open findings</span><strong>{unresolvedCount}</strong><p>Require human review</p></article><article className="metric-card"><span>Confirmed rules</span><strong>{confirmedRuleCount}</strong><p>Ready for policy checks</p></article><article className="metric-card"><span>Workspace</span><strong>{isPolicyConfirmed ? "Ready" : "Setup"}</strong><p>Based on manually entered rules</p></article></section>
    <section className="findings-section" aria-labelledby="findings-heading"><div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="findings-heading">Unresolved findings</h2></div><div className="button-group"><button className="button button--secondary" onClick={clearWorkspace}>Clear workspace</button><button className="button button--secondary" onClick={() => navigate("/rollout")}>View all findings</button></div></div>{findings.length === 0 ? <div className="empty-state"><strong>No findings available.</strong><span>Findings will appear when configuration records are connected and checked against confirmed rules.</span></div> : <div className="finding-grid">{findings.map((finding) => <FindingCard key={finding.id} finding={finding} />)}</div>}</section>
  </section>;
}
