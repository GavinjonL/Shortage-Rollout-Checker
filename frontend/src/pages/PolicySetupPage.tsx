import { useState } from "react";
import { useDemo } from "../context/DemoContext";

export function PolicySetupPage() {
  const { policyText, rules, confirmedRuleCount, loadDemoPolicy, createCandidateRules, updateRule, recordActivity } = useDemo();
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");

  function loadPolicy() { loadDemoPolicy(); setNotice("Fictional demo policy loaded. Review it before creating a draft."); }
  function generateDraft() {
    if (!policyText.trim()) { setNotice("Load the sample policy before creating a draft."); return; }
    setIsGenerating(true); setNotice("");
    window.setTimeout(() => { createCandidateRules(); setIsGenerating(false); setNotice("Mock draft created. Review each candidate rule before confirming it."); }, 450);
  }
  function setRuleStatus(id: string, status: "Draft" | "Confirmed" | "Rejected") {
    updateRule(id, { status });
    if (status === "Confirmed") recordActivity({ actor: "Pharmacist reviewer", feature: "Policy Setup", action: "Confirmed policy rule", target: id, detail: "Confirmed a fictional policy rule for the demo." });
  }

  return <section className="policy-setup" aria-labelledby="policy-setup-title">
    <div className="page-heading"><div><p className="eyebrow">Policy intake</p><h1 id="policy-setup-title">Review shortage policy rules</h1><p className="page-intro">Create a draft from fictional policy text, then confirm every rule before it can be used elsewhere in the demo.</p></div><div className="demo-label">Demo data · Review only</div></div>
    <div className="policy-grid">
      <article className="policy-card"><div className="card-heading"><div><p className="step-label">Step 1</p><h2>Approved sample policy</h2></div><button className="secondary-button" type="button" onClick={loadPolicy}>Load demo policy</button></div><label htmlFor="policy-text">Policy text</label><textarea id="policy-text" value={policyText} readOnly placeholder="Load fictional, approved policy text here…" rows={12} /><p className="field-help">For this prototype, use fictional sample policy text only. No patient data is needed.</p><button className="primary-button" type="button" onClick={generateDraft} disabled={isGenerating}>{isGenerating ? "Creating draft…" : "Create candidate rules"}</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</article>
      <aside className="review-guide" aria-label="Review requirements"><p className="step-label">Before confirmation</p><h2>A pharmacist reviews the draft</h2><ul><li>Check that each rule reflects its quoted source text.</li><li>Clarify missing thresholds, populations, or exceptions.</li><li>Confirm, edit, or reject each rule individually.</li></ul><div className="rule-count"><strong>{confirmedRuleCount}</strong> of {rules.length} rules confirmed</div></aside>
    </div>
    {rules.length > 0 && <section className="rule-review" aria-labelledby="candidate-rules-title"><div className="section-heading"><div><p className="step-label">Step 2</p><h2 id="candidate-rules-title">Candidate rules</h2></div><p>Drafted from the supplied sample policy. Not active until confirmed.</p></div><div className="ambiguity-callout"><strong>Clarification needed:</strong> The policy refers to a “pharmacy-defined shortage threshold” but does not name a value. Confirm the threshold in the approved policy before rollout checks or simulations rely on this rule.</div><div className="rule-list">{rules.map((rule) => <article className="candidate-rule" key={rule.id}><div className="rule-topline"><span className="rule-id">{rule.id}</span><span className={`rule-status rule-status--${rule.status.toLowerCase()}`}>{rule.status}</span></div><label htmlFor={`${rule.id}-title`}>Rule name</label><input id={`${rule.id}-title`} value={rule.title} onChange={(event) => updateRule(rule.id, { title: event.target.value })} /><div className="rule-details"><div><span>When</span><p>{rule.condition}</p></div><div><span>Expected behavior</span><p>{rule.expectedBehavior}</p></div></div><blockquote><span>Source excerpt</span>{rule.sourceExcerpt}</blockquote><div className="rule-actions"><button className="primary-button" type="button" onClick={() => setRuleStatus(rule.id, "Confirmed")}>Confirm rule</button><button className="secondary-button" type="button" onClick={() => setRuleStatus(rule.id, "Draft")}>Keep as draft</button><button className="text-button danger-button" type="button" onClick={() => setRuleStatus(rule.id, "Rejected")}>Reject</button></div></article>)}</div></section>}
  </section>;
}
