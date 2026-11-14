import { useMemo, useState } from "react";

type RuleStatus = "Draft" | "Confirmed" | "Rejected";

interface CandidateRule {
  id: string;
  title: string;
  condition: string;
  expectedBehavior: string;
  sourceExcerpt: string;
  status: RuleStatus;
}

const demoPolicy = `Fictional shortage policy — Acetaminophen IV 10 mg/mL

When IV acetaminophen stock is below the pharmacy-defined shortage threshold, new adult orders should use the approved oral acetaminophen alternative when the patient can take oral medication. The alternative must not be used when oral administration is contraindicated. Departmental order sets and dispensing-system instructions must display the current shortage guidance.`;

const initialRules: CandidateRule[] = [
  { id: "POL-001", title: "Use the approved oral alternative when eligible", condition: "IV acetaminophen stock is below the shortage threshold and oral administration is appropriate.", expectedBehavior: "Present the approved oral acetaminophen alternative for new adult orders.", sourceExcerpt: "New adult orders should use the approved oral acetaminophen alternative when the patient can take oral medication.", status: "Draft" },
  { id: "POL-002", title: "Do not substitute when oral use is contraindicated", condition: "Oral administration is contraindicated.", expectedBehavior: "Do not present the oral alternative as a shortage substitution.", sourceExcerpt: "The alternative must not be used when oral administration is contraindicated.", status: "Draft" },
  { id: "POL-003", title: "Keep rollout instructions current", condition: "The shortage policy is active.", expectedBehavior: "Order sets and dispensing-system instructions display current shortage guidance.", sourceExcerpt: "Departmental order sets and dispensing-system instructions must display the current shortage guidance.", status: "Draft" },
];

export function PolicySetupPage() {
  const [policyText, setPolicyText] = useState("");
  const [rules, setRules] = useState<CandidateRule[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const confirmedCount = useMemo(() => rules.filter((rule) => rule.status === "Confirmed").length, [rules]);

  function loadDemoPolicy() { setPolicyText(demoPolicy); setRules([]); setNotice("Fictional demo policy loaded. Review it before creating a draft."); }
  function generateDraft() {
    if (!policyText.trim()) { setNotice("Paste or load a sample policy before creating a draft."); return; }
    setIsGenerating(true); setNotice("");
    window.setTimeout(() => { setRules(initialRules); setIsGenerating(false); setNotice("Mock draft created. Review each candidate rule before confirming it."); }, 450);
  }
  function updateRule(id: string, updates: Partial<CandidateRule>) { setRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...updates } : rule)); }

  return <section className="policy-setup" aria-labelledby="policy-setup-title">
    <div className="page-heading"><div><p className="eyebrow">Policy intake</p><h1 id="policy-setup-title">Review shortage policy rules</h1><p className="page-intro">Create a draft from fictional policy text, then confirm every rule before it can be used elsewhere in the demo.</p></div><div className="demo-label">Demo data · Review only</div></div>
    <div className="policy-grid">
      <article className="policy-card"><div className="card-heading"><div><p className="step-label">Step 1</p><h2>Approved sample policy</h2></div><button className="secondary-button" type="button" onClick={loadDemoPolicy}>Load demo policy</button></div><label htmlFor="policy-text">Policy text</label><textarea id="policy-text" value={policyText} onChange={(event) => setPolicyText(event.target.value)} placeholder="Paste fictional, approved policy text here…" rows={12} /><p className="field-help">For this prototype, use fictional sample policy text only. No patient data is needed.</p><button className="primary-button" type="button" onClick={generateDraft} disabled={isGenerating}>{isGenerating ? "Creating draft…" : "Create candidate rules"}</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</article>
      <aside className="review-guide" aria-label="Review requirements"><p className="step-label">Before confirmation</p><h2>A pharmacist reviews the draft</h2><ul><li>Check that each rule reflects its quoted source text.</li><li>Clarify missing thresholds, populations, or exceptions.</li><li>Confirm, edit, or reject each rule individually.</li></ul><div className="rule-count"><strong>{confirmedCount}</strong> of {rules.length} rules confirmed</div></aside>
    </div>
    {rules.length > 0 && <section className="rule-review" aria-labelledby="candidate-rules-title"><div className="section-heading"><div><p className="step-label">Step 2</p><h2 id="candidate-rules-title">Candidate rules</h2></div><p>Drafted from the supplied sample policy. Not active until confirmed.</p></div><div className="ambiguity-callout"><strong>Clarification needed:</strong> The policy refers to a “pharmacy-defined shortage threshold” but does not name a value. Confirm the threshold in the approved policy before rollout checks or simulations rely on this rule.</div><div className="rule-list">{rules.map((rule) => <article className="candidate-rule" key={rule.id}><div className="rule-topline"><span className="rule-id">{rule.id}</span><span className={`rule-status rule-status--${rule.status.toLowerCase()}`}>{rule.status}</span></div><label htmlFor={`${rule.id}-title`}>Rule name</label><input id={`${rule.id}-title`} value={rule.title} onChange={(event) => updateRule(rule.id, { title: event.target.value })} /><div className="rule-details"><div><span>When</span><p>{rule.condition}</p></div><div><span>Expected behavior</span><p>{rule.expectedBehavior}</p></div></div><blockquote><span>Source excerpt</span>{rule.sourceExcerpt}</blockquote><div className="rule-actions"><button className="primary-button" type="button" onClick={() => updateRule(rule.id, { status: "Confirmed" })}>Confirm rule</button><button className="secondary-button" type="button" onClick={() => updateRule(rule.id, { status: "Draft" })}>Keep as draft</button><button className="text-button danger-button" type="button" onClick={() => updateRule(rule.id, { status: "Rejected" })}>Reject</button></div></article>)}</div></section>}
  </section>;
}
