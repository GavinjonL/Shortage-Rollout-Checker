import { useState } from "react";
import { confirmPolicyRules, extractPolicyDraft, fetchPolicyHistory, savePolicyRuleReview } from "../api/client";
import { useDemo } from "../context/DemoContext";
import type { CandidateRule, PolicyRule, RuleStatus } from "../types";

function asPolicyRule(rule: CandidateRule): PolicyRule | null {
  if (!rule.medicationId || !rule.departmentId || !rule.restriction || !rule.effectiveDate) return null;
  return { id: rule.id, policy_id: "policy-ui-draft", medication_id: rule.medicationId, department_id: rule.departmentId, condition: rule.condition, restriction: rule.restriction, approved_alternative_id: rule.approvedAlternativeId ?? null, effective_date: rule.effectiveDate, source_excerpt: rule.sourceExcerpt, confirmed_by_user: true };
}

export function PolicySetupPage() {
  const { policyText, rules, confirmedRuleCount, loadDemoPolicy, setPolicyText, setCandidateRules, updateRule, recordActivity } = useDemo();
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [ambiguities, setAmbiguities] = useState<string[]>([]);
  const [historyVersions, setHistoryVersions] = useState<number[]>([]);

  async function persistReview(rule: CandidateRule, status = rule.status) {
    await savePolicyRuleReview({ rule_id: rule.id, policy_id: "policy-ui-draft", status, title: rule.title, medication_id: rule.medicationId ?? null, department_id: rule.departmentId ?? null, condition: rule.condition, restriction: rule.restriction ?? null, approved_alternative_id: rule.approvedAlternativeId ?? null, effective_date: rule.effectiveDate ?? null, source_excerpt: rule.sourceExcerpt });
  }

  function loadPolicy() { loadDemoPolicy(); setAmbiguities([]); setHistoryVersions([]); setNotice("Fictional demo policy loaded. Review it before creating a draft."); }

  async function generateDraft() {
    if (!policyText.trim()) { setNotice("Paste or load fictional policy text before creating a draft."); return; }
    setIsGenerating(true); setNotice("");
    try {
      const draft = await extractPolicyDraft(policyText);
      setCandidateRules(draft.rules.map((rule, index) => ({
        id: `POL-AI-${String(index + 1).padStart(3, "0")}`,
        title: [rule.medication_id, rule.restriction].filter(Boolean).join(" — ") || `Policy rule ${index + 1}`,
        condition: rule.condition ?? "Not specified in the source policy.",
        expectedBehavior: rule.restriction ?? "Review the supporting source excerpt.", sourceExcerpt: rule.source_excerpt, status: "Draft",
        medicationId: rule.medication_id, departmentId: rule.department_id, restriction: rule.restriction,
        approvedAlternativeId: rule.approved_alternative_id, effectiveDate: rule.effective_date,
      })));
      setAmbiguities(draft.ambiguities);
      recordActivity({ actor: "AI policy extractor", feature: "Policy Setup", action: "Created unconfirmed policy draft", target: draft.policy_id, detail: `${draft.rules.length} draft rule(s) created from fictional policy text.` });
      setNotice("AI draft created. Review every rule before confirming it.");
    } catch (error) { setCandidateRules([]); setAmbiguities([]); setNotice(error instanceof Error ? error.message : "Unable to create a policy draft."); }
    finally { setIsGenerating(false); }
  }

  async function changeStatus(rule: CandidateRule, status: RuleStatus) {
    try {
      if (status === "Confirmed") {
        const confirmed = rules.filter((item) => item.status === "Confirmed" && item.id !== rule.id).concat({ ...rule, status }).map(asPolicyRule);
        if (confirmed.some((item) => !item)) { setNotice("Medication, department, restriction, and effective date are required before confirmation."); return; }
        await confirmPolicyRules(confirmed as PolicyRule[]);
      }
      await persistReview(rule, status);
      updateRule(rule.id, { status });
      recordActivity({ actor: "Pharmacist reviewer", feature: "Policy Setup", action: `${status} policy rule`, target: rule.id, detail: "Saved a fictional policy-rule review." });
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save policy-rule review."); }
  }

  async function editRule(rule: CandidateRule, updates: Partial<CandidateRule>) {
    const updated = { ...rule, ...updates };
    updateRule(rule.id, updates);
    try { await persistReview(updated); } catch { setNotice("Unable to save rule edit."); }
  }

  async function viewHistory() {
    try { const history = await fetchPolicyHistory(); setHistoryVersions(history.versions.map((version) => version.version)); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load revision history."); }
  }

  return <section className="policy-setup" aria-labelledby="policy-setup-title">
    <div className="page-heading"><div><p className="eyebrow">Policy intake</p><h1 id="policy-setup-title">Review shortage policy rules</h1><p className="page-intro">Create a draft from fictional policy text, then confirm every rule before it can be used elsewhere in the demo.</p></div><div className="demo-label">Demo data · Review only</div></div>
    <div className="policy-grid"><article className="policy-card"><div className="card-heading"><div><p className="step-label">Step 1</p><h2>Approved sample policy</h2></div><button className="secondary-button" type="button" onClick={loadPolicy}>Load demo policy</button></div><label htmlFor="policy-text">Policy text</label><textarea id="policy-text" value={policyText} onChange={(event) => setPolicyText(event.target.value)} placeholder="Paste fictional, approved policy text here…" rows={12} /><p className="field-help">Use fictional policy text only. No patient data is needed.</p><button className="primary-button" type="button" onClick={generateDraft} disabled={isGenerating}>{isGenerating ? "Creating draft…" : "Create candidate rules"}</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</article><aside className="review-guide"><p className="step-label">Before confirmation</p><h2>A pharmacist reviews the draft</h2><ul><li>Check quoted source text.</li><li>Clarify missing information.</li><li>Confirm, edit, reject, or reopen each rule.</li></ul><div className="rule-count"><strong>{confirmedRuleCount}</strong> of {rules.length} rules confirmed</div><button className="text-button" type="button" onClick={viewHistory}>View revision history</button>{historyVersions.length > 0 && <p className="field-help">Saved versions: {historyVersions.join(", ")}</p>}</aside></div>
    {(rules.length > 0 || ambiguities.length > 0) && <section className="rule-review"><div className="section-heading"><div><p className="step-label">Step 2</p><h2>Candidate rules</h2></div><p>AI-generated draft. Not active until confirmed.</p></div>{ambiguities.map((ambiguity) => <div className="ambiguity-callout" key={ambiguity}><strong>Clarification needed:</strong> {ambiguity}</div>)}<div className="rule-list">{rules.map((rule) => <article className="candidate-rule" key={rule.id}><div className="rule-topline"><span className="rule-id">{rule.id}</span><span className={`rule-status rule-status--${rule.status.toLowerCase()}`}>{rule.status}</span></div><label>Rule name<input value={rule.title} onChange={(event) => editRule(rule, { title: event.target.value })} /></label><div className="rule-details"><label>Medication<input value={rule.medicationId ?? ""} onChange={(event) => editRule(rule, { medicationId: event.target.value || null })} /></label><label>Department<input value={rule.departmentId ?? ""} onChange={(event) => editRule(rule, { departmentId: event.target.value || null })} /></label><label>Restriction<input value={rule.restriction ?? ""} onChange={(event) => editRule(rule, { restriction: event.target.value || null })} /></label><label>Effective date<input value={rule.effectiveDate ?? ""} onChange={(event) => editRule(rule, { effectiveDate: event.target.value || null })} /></label><label>Approved alternative<input value={rule.approvedAlternativeId ?? ""} onChange={(event) => editRule(rule, { approvedAlternativeId: event.target.value || null })} /></label><div><span>When</span><p>{rule.condition}</p></div></div><blockquote><span>Source excerpt</span>{rule.sourceExcerpt}</blockquote><div className="rule-actions"><button className="primary-button" type="button" onClick={() => changeStatus(rule, "Confirmed")}>Confirm rule</button><button className="secondary-button" type="button" onClick={() => changeStatus(rule, "Draft")}>{rule.status === "Confirmed" ? "Reopen as draft" : "Keep as draft"}</button><button className="text-button danger-button" type="button" onClick={() => changeStatus(rule, "Rejected")}>Reject</button></div></article>)}</div></section>}
  </section>;
}
