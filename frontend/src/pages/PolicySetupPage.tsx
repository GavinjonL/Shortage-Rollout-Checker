import { useState } from "react";
import { confirmPolicyRules, fetchPolicyHistory, savePolicyRuleReview } from "../api/client";
import type { PolicyRuleReview } from "../api/client";
import { useDemo } from "../context/DemoContext";
import type { CandidateRule, PolicyRule, RuleStatus } from "../types";

function asPolicyRule(rule: CandidateRule): PolicyRule | null {
  if (!rule.medicationId || !rule.departmentId || !rule.restriction || !rule.effectiveDate) return null;
  return { id: rule.id, policy_id: "policy-ui-draft", medication_id: rule.medicationId, department_id: rule.departmentId, condition: rule.condition, restriction: rule.restriction, approved_alternative_id: rule.approvedAlternativeId ?? null, effective_date: rule.effectiveDate, source_excerpt: rule.sourceExcerpt, confirmed_by_user: true };
}

export function PolicySetupPage() {
  const { policyText, rules, confirmedRuleCount, setPolicyText, addRule, updateRule, removeRule, recordActivity } = useDemo();
  const [notice, setNotice] = useState("");
  const [historyVersions, setHistoryVersions] = useState<Array<{ version: number; rules: PolicyRuleReview[] }>>([]);

  async function persistReview(rule: CandidateRule, status = rule.status) {
    await savePolicyRuleReview({ rule_id: rule.id, policy_id: "policy-ui-draft", status, title: rule.title, medication_id: rule.medicationId ?? null, department_id: rule.departmentId ?? null, condition: rule.condition, restriction: rule.restriction ?? null, approved_alternative_id: rule.approvedAlternativeId ?? null, effective_date: rule.effectiveDate ?? null, source_excerpt: rule.sourceExcerpt });
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
      recordActivity({ actor: "Policy reviewer", feature: "Policy Setup", action: `${status} policy rule`, target: rule.id, detail: "Updated a manually entered policy rule." });
      setNotice(status === "Confirmed" ? "Rule confirmed." : "Rule status updated.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save policy-rule review."); }
  }
  async function saveRule(rule: CandidateRule, updates: Partial<CandidateRule>) {
    const updated = { ...rule, ...updates };
    updateRule(rule.id, updates);
    try { await persistReview(updated); } catch { setNotice("Saved locally; the review service could not be reached."); }
  }
  async function viewHistory() {
    try { const history = await fetchPolicyHistory(); setHistoryVersions(history.versions); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load revision history."); }
  }

  return <section className="policy-setup" aria-labelledby="policy-setup-title">
    <div className="page-heading"><div><p className="eyebrow">Policy intake</p><h1 id="policy-setup-title">Enter policy rules</h1><p className="page-intro">Enter the source policy and each rule manually, then review and confirm.</p></div></div>
    <div className="policy-grid"><article className="policy-card"><div className="card-heading"><div><p className="step-label">Step 1</p><h2>Source policy</h2></div></div><label htmlFor="policy-text">Policy text</label><textarea id="policy-text" value={policyText} onChange={(event) => setPolicyText(event.target.value)} placeholder="Paste or type the policy text here…" rows={12} /><p className="field-help">This workspace starts blank. Add each rule below from the policy you entered.</p></article><aside className="review-guide"><p className="step-label">Step 2</p><h2>Add and review rules</h2><ul><li>Add every policy rule that requires confirmation.</li><li>Complete the structured fields for each rule.</li><li>Confirm only after review.</li></ul><div className="rule-count"><strong>{confirmedRuleCount}</strong> of {rules.length} rules confirmed</div><button className="text-button" type="button" onClick={viewHistory}>View history</button>{historyVersions.length > 0 && <section className="revision-history" aria-label="Policy rule revision history"><p className="field-help">Latest {Math.min(5, historyVersions.length)} of {historyVersions.length} saved versions</p>{historyVersions.slice(-5).reverse().map((version) => <div className="revision-entry" key={version.version}><strong>Version {version.version}</strong>{version.rules.map((rule) => <span key={rule.rule_id}>{rule.rule_id} · {rule.status} · {rule.medication_id ?? "Medication missing"}</span>)}</div>)}</section>}</aside></div>
    <section className="rule-review"><div className="section-heading"><div><p className="step-label">Step 3</p><h2>Policy rules</h2></div><button className="primary-button" type="button" onClick={addRule}>Add rule</button></div>{notice && <p className="inline-notice" role="status">{notice}</p>}{rules.length === 0 ? <div className="empty-state"><strong>No rules entered yet.</strong><span>Add a rule to begin the manual review.</span></div> : <div className="rule-list">{rules.map((rule) => <article className="candidate-rule" key={rule.id}><div className="rule-topline"><span className="rule-id">{rule.id}</span><span className={`rule-status rule-status--${rule.status.toLowerCase()}`}>{rule.status}</span></div><label>Rule name<input value={rule.title} onChange={(event) => saveRule(rule, { title: event.target.value })} /></label><div className="rule-details"><label>Medication<input value={rule.medicationId ?? ""} onChange={(event) => saveRule(rule, { medicationId: event.target.value || null })} /></label><label>Department<input value={rule.departmentId ?? ""} onChange={(event) => saveRule(rule, { departmentId: event.target.value || null })} /></label><label>Restriction<input value={rule.restriction ?? ""} onChange={(event) => saveRule(rule, { restriction: event.target.value || null })} /></label><label>Effective date<input type="date" value={rule.effectiveDate ?? ""} onChange={(event) => saveRule(rule, { effectiveDate: event.target.value || null })} /></label><label>Approved alternative<input value={rule.approvedAlternativeId ?? ""} onChange={(event) => saveRule(rule, { approvedAlternativeId: event.target.value || null })} /></label><label>When<input value={rule.condition} onChange={(event) => saveRule(rule, { condition: event.target.value })} /></label></div><label>Source excerpt<textarea value={rule.sourceExcerpt} onChange={(event) => saveRule(rule, { sourceExcerpt: event.target.value })} rows={3} /></label><div className="rule-actions"><button className="primary-button" type="button" onClick={() => changeStatus(rule, "Confirmed")}>Confirm rule</button><button className="secondary-button" type="button" onClick={() => changeStatus(rule, "Draft")}>{rule.status === "Confirmed" ? "Reopen as draft" : "Keep as draft"}</button><button className="text-button danger-button" type="button" onClick={() => changeStatus(rule, "Rejected")}>Reject</button><button className="text-button danger-button" type="button" onClick={() => removeRule(rule.id)}>Remove</button></div></article>)}</div>}</section>
  </section>;
}
