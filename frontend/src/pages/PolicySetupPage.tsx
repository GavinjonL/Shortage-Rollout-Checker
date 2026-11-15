import { useState } from "react";
import { extractPolicyDraft } from "../api/client";
import { useDemo } from "../context/DemoContext";
import type { CandidateRule } from "../types";

export function PolicySetupPage() {
  const { policyText, rules, confirmedRuleCount, loadDemoPolicy, setCandidateRules, updateRule, recordActivity } = useDemo();
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [ambiguities, setAmbiguities] = useState<string[]>([]);

  function loadPolicy() {
    loadDemoPolicy();
    setAmbiguities([]);
    setNotice("Fictional demo policy loaded. Review it before creating a draft.");
  }

  async function generateDraft() {
    if (!policyText.trim()) {
      setNotice("Load the sample policy before creating a draft.");
      return;
    }
    setIsGenerating(true);
    setNotice("");
    try {
      const draft = await extractPolicyDraft(policyText);
      const draftRules: CandidateRule[] = draft.rules.map((rule, index) => ({
        id: `POL-AI-${String(index + 1).padStart(3, "0")}`,
        title: [rule.medication_id, rule.restriction].filter(Boolean).join(" — ") || `Policy rule ${index + 1}`,
        condition: rule.condition ?? "Not specified in the source policy.",
        expectedBehavior: [
          rule.restriction,
          rule.approved_alternative_id ? `Approved alternative: ${rule.approved_alternative_id}.` : null,
          rule.effective_date ? `Effective date: ${rule.effective_date}.` : null,
        ].filter(Boolean).join(" ") || "Review the supporting source excerpt.",
        sourceExcerpt: rule.source_excerpt,
        status: "Draft",
      }));
      setCandidateRules(draftRules);
      setAmbiguities(draft.ambiguities);
      recordActivity({
        actor: "AI policy extractor",
        feature: "Policy Setup",
        action: "Created unconfirmed policy draft",
        target: draft.policy_id,
        detail: `${draftRules.length} draft rule(s) created from fictional policy text.`,
      });
      setNotice(draftRules.length
        ? "AI draft created. Review every rule before confirming it."
        : "No rules were extracted. Review the listed ambiguities or check AI provider configuration.");
    } catch (error) {
      setCandidateRules([]);
      setAmbiguities([]);
      setNotice(error instanceof Error ? error.message : "Unable to create a policy draft.");
    } finally {
      setIsGenerating(false);
    }
  }

  function setRuleStatus(id: string, status: "Draft" | "Confirmed" | "Rejected") {
    updateRule(id, { status });
    if (status === "Confirmed") {
      recordActivity({ actor: "Pharmacist reviewer", feature: "Policy Setup", action: "Confirmed policy rule", target: id, detail: "Confirmed a fictional policy rule for the demo." });
    }
  }

  return <section className="policy-setup" aria-labelledby="policy-setup-title">
    <div className="page-heading"><div><p className="eyebrow">Policy intake</p><h1 id="policy-setup-title">Review shortage policy rules</h1><p className="page-intro">Create a draft from fictional policy text, then confirm every rule before it can be used elsewhere in the demo.</p></div><div className="demo-label">Demo data · Review only</div></div>
    <div className="policy-grid">
      <article className="policy-card"><div className="card-heading"><div><p className="step-label">Step 1</p><h2>Approved sample policy</h2></div><button className="secondary-button" type="button" onClick={loadPolicy}>Load demo policy</button></div><label htmlFor="policy-text">Policy text</label><textarea id="policy-text" value={policyText} readOnly placeholder="Load fictional, approved policy text here…" rows={12} /><p className="field-help">For this prototype, use fictional sample policy text only. No patient data is needed.</p><button className="primary-button" type="button" onClick={generateDraft} disabled={isGenerating}>{isGenerating ? "Creating draft…" : "Create candidate rules"}</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</article>
      <aside className="review-guide" aria-label="Review requirements"><p className="step-label">Before confirmation</p><h2>A pharmacist reviews the draft</h2><ul><li>Check that each rule reflects its quoted source text.</li><li>Clarify missing thresholds, populations, or exceptions.</li><li>Confirm, edit, or reject each rule individually.</li></ul><div className="rule-count"><strong>{confirmedRuleCount}</strong> of {rules.length} rules confirmed</div></aside>
    </div>
    {(rules.length > 0 || ambiguities.length > 0) && <section className="rule-review" aria-labelledby="candidate-rules-title"><div className="section-heading"><div><p className="step-label">Step 2</p><h2 id="candidate-rules-title">Candidate rules</h2></div><p>AI-generated draft. Not active until confirmed.</p></div>{ambiguities.map((ambiguity) => <div className="ambiguity-callout" key={ambiguity}><strong>Clarification needed:</strong> {ambiguity}</div>)}<div className="rule-list">{rules.map((rule) => <article className="candidate-rule" key={rule.id}><div className="rule-topline"><span className="rule-id">{rule.id}</span><span className={`rule-status rule-status--${rule.status.toLowerCase()}`}>{rule.status}</span></div><label htmlFor={`${rule.id}-title`}>Rule name</label><input id={`${rule.id}-title`} value={rule.title} onChange={(event) => updateRule(rule.id, { title: event.target.value })} /><div className="rule-details"><div><span>When</span><p>{rule.condition}</p></div><div><span>Expected behavior</span><p>{rule.expectedBehavior}</p></div></div><blockquote><span>Source excerpt</span>{rule.sourceExcerpt}</blockquote><div className="rule-actions"><button className="primary-button" type="button" onClick={() => setRuleStatus(rule.id, "Confirmed")}>Confirm rule</button><button className="secondary-button" type="button" onClick={() => setRuleStatus(rule.id, "Draft")}>Keep as draft</button><button className="text-button danger-button" type="button" onClick={() => setRuleStatus(rule.id, "Rejected")}>Reject</button></div></article>)}</div></section>}
  </section>;
}
