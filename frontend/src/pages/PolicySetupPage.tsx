import { useEffect, useState } from "react";
import { confirmPolicyRules, extractPolicyDraft, fetchPolicyHistory, savePolicyRuleReview, fetchAIStatus, fetchPolicySamples, type PolicySample } from "../api/client";
import type { PolicyRuleReview } from "../api/client";
import { useDemo } from "../context/DemoContext";
import type { CandidateRule, PolicyRule, RuleStatus } from "../types";

function asPolicyRule(rule: CandidateRule): PolicyRule | null {
  if (!rule.medicationId || !rule.departmentId || !rule.restriction || !rule.effectiveDate) return null;
  return { id: rule.id, policy_id: "policy-ui-draft", medication_id: rule.medicationId, department_id: rule.departmentId, condition: rule.condition, restriction: rule.restriction, approved_alternative_id: rule.approvedAlternativeId ?? null, effective_date: rule.effectiveDate, source_excerpt: rule.sourceExcerpt, confirmed_by_user: true };
}

export function PolicySetupPage() {
  const { policyText, rules, confirmedRuleCount, setPolicyText, setCandidateRules, updateRule, recordActivity } = useDemo();
  const [samples, setSamples] = useState<PolicySample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState("comparison-a");
  const [sampleError, setSampleError] = useState("");
  useEffect(() => { fetchPolicySamples().then(setSamples).catch(error => setSampleError(error.message)); }, []);
  const loadedSample = samples.find(sample => sample.policy_text === policyText);
  const [aiStatus, setAIStatus] = useState<Awaited<ReturnType<typeof fetchAIStatus>> | null>(null);
  useEffect(() => { fetchAIStatus().then(setAIStatus).catch(() => setAIStatus(null)); }, []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [ambiguities, setAmbiguities] = useState<string[]>([]);
  const [historyVersions, setHistoryVersions] = useState<Array<{ version: number; rules: PolicyRuleReview[] }>>([]);

  async function persistReview(rule: CandidateRule, status = rule.status) {
    await savePolicyRuleReview({ rule_id: rule.id, policy_id: "policy-ui-draft", status, title: rule.title, medication_id: rule.medicationId ?? null, department_id: rule.departmentId ?? null, condition: rule.condition, restriction: rule.restriction ?? null, approved_alternative_id: rule.approvedAlternativeId ?? null, effective_date: rule.effectiveDate ?? null, source_excerpt: rule.sourceExcerpt });
  }

  async function loadPolicy() {
    const sample = samples.find(item => item.id === selectedSampleId);
    if (!sample) { setNotice("Select an available sample first."); return; }
    try { await confirmPolicyRules([]); setPolicyText(sample.policy_text); setAmbiguities([]); setHistoryVersions([]); setAIStatus(null); setNotice(`${sample.name} loaded. Create a draft, review its fields, then confirm the rule.`); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to clear the previous policy."); }
  }
  async function changePolicyText(text: string) {
    setPolicyText(text); setAIStatus(null); setAmbiguities([]);
    if (rules.length) {
      try { await confirmPolicyRules([]); }
      catch (error) { setNotice(error instanceof Error ? error.message : "Unable to clear the previous policy."); }
    }
  }

  async function generateDraft() {
    if (!policyText.trim()) { setNotice("Paste or load fictional policy text before creating a draft."); return; }
    setIsGenerating(true); setNotice("");
    try {
      await confirmPolicyRules([]);
      setCandidateRules([]);
      const draft = await extractPolicyDraft(policyText);
      const connection = await fetchAIStatus().catch(() => null);
      setAIStatus(connection);
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
      setNotice(connection?.mode === "offline" ? "OFFLINE MOCK: no AI provider was called. This draft is for interface testing only." : "AI draft created. Review every rule before confirming it.");
    } catch (error) { setCandidateRules([]); setAmbiguities([]); setNotice(error instanceof Error ? error.message : "Unable to create a policy draft."); }
    finally { setIsGenerating(false); }
  }

  async function changeStatus(rule: CandidateRule, status: RuleStatus) {
    try {
      const confirmed = rules.map(item => item.id === rule.id ? { ...item, status } : item).filter(item => item.status === "Confirmed").map(asPolicyRule);
      if (confirmed.some(item => !item)) { setNotice("Medication, department, restriction, and effective date are required before confirmation."); return; }
      await confirmPolicyRules(confirmed as PolicyRule[]);
      await persistReview(rule, status);
      updateRule(rule.id, { status });
      recordActivity({ actor: "Pharmacist reviewer", feature: "Policy Setup", action: `${status} policy rule`, target: rule.id, detail: "Saved a fictional policy-rule review." });
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save policy-rule review."); }
  }

  async function editRule(rule: CandidateRule, updates: Partial<CandidateRule>) {
    const updated = { ...rule, ...updates, status: "Draft" as const };
    updateRule(rule.id, { ...updates, status: "Draft" });
    try { await persistReview(updated); } catch { setNotice("Unable to save rule edit."); }
  }

  async function viewHistory() {
    try { const history = await fetchPolicyHistory(); setHistoryVersions(history.versions); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load revision history."); }
  }

  return <section className="policy-setup" aria-labelledby="policy-setup-title">
    <div className="page-heading"><div><p className="eyebrow">Policy intake</p><h1 id="policy-setup-title">Review policy rules</h1><p className="page-intro">Draft, review, and confirm.</p></div><div className="demo-label">Demo only</div></div>
    <div className="policy-grid"><article className="policy-card"><div className="card-heading"><div><p className="step-label">Step 1</p><h2>Sample policy</h2></div><button className="secondary-button" type="button" disabled={isGenerating || samples.length === 0} onClick={loadPolicy}>Load sample</button></div><label htmlFor="policy-sample">Choose a test scenario</label><select id="policy-sample" className="policy-sample-select" value={selectedSampleId} disabled={isGenerating || samples.length === 0} onChange={event => setSelectedSampleId(event.target.value)}>{samples.map(sample => <option key={sample.id} value={sample.id}>{sample.name}</option>)}</select>{sampleError && <p role="alert" className="inline-notice">{sampleError}</p>}<label htmlFor="policy-text">Policy text</label><textarea id="policy-text" value={policyText} disabled={isGenerating} onChange={(event) => changePolicyText(event.target.value)} placeholder="Paste fictional policy text…" rows={12} /><p className="field-help">Fictional data only. Use medication and department IDs from the loaded dataset.</p>{aiStatus && <p role="status">Provider: {aiStatus.provider} / {aiStatus.model}. Mode: {aiStatus.mode}. Provider requests this server session: {aiStatus.calls.length}. Last result: {aiStatus.calls[aiStatus.calls.length - 1]?.status ?? "No provider call (offline mode)"}.</p>}<button className="primary-button" type="button" onClick={generateDraft} disabled={isGenerating}>{isGenerating ? "Creating draft…" : "Create draft"}</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</article><aside className="review-guide"><p className="step-label">Before confirmation</p><h2>Review the draft</h2><ul><li>Check the source text.</li><li>Fill missing details.</li><li>Confirm, edit, or reject.</li></ul><div className="rule-count"><strong>{confirmedRuleCount}</strong> of {rules.length} rules confirmed</div><button className="text-button" type="button" onClick={viewHistory}>View history</button>{historyVersions.length > 0 && <section className="revision-history" aria-label="Policy rule revision history"><p className="field-help">Latest {Math.min(5, historyVersions.length)} of {historyVersions.length} saved versions</p>{historyVersions.slice(-5).reverse().map((version) => <div className="revision-entry" key={version.version}><strong>Version {version.version}</strong>{version.rules.map((rule) => <span key={rule.rule_id}>{rule.rule_id} · {rule.status} · {rule.medication_id ?? "Medication missing"}</span>)}</div>)}</section>}</aside></div>
    {loadedSample && <details className="sample-expectations">
      <summary>Expected results for {loadedSample.id === "comparison-a" ? "sample A" : "sample B"}</summary>
      <p>{loadedSample.description}</p>
      <p>These are expectations for the baseline demo data, not generated findings. Use Reset on Overview once before comparing the samples, and confirm each draft separately.</p>
      <div className="config-table-wrap"><table><thead><tr><th>Feature</th><th>Expected outcome</th></tr></thead><tbody>{Object.entries(loadedSample.expected_results).map(([feature, outcome]) => <tr key={feature}><td>{feature}</td><td>{outcome}</td></tr>)}</tbody></table></div>
    </details>}
    {(rules.length > 0 || ambiguities.length > 0) && <section className="rule-review"><div className="section-heading"><div><p className="step-label">Step 2</p><h2>Candidate rules</h2></div><p>AI-generated draft. Not active until confirmed.</p></div>{ambiguities.map((ambiguity) => <div className="ambiguity-callout" key={ambiguity}><strong>Clarification needed:</strong> {ambiguity}</div>)}<div className="rule-list">{rules.map((rule) => <article className="candidate-rule" key={rule.id}><div className="rule-topline"><span className="rule-id">{rule.id}</span><span className={`rule-status rule-status--${rule.status.toLowerCase()}`}>{rule.status}</span></div><label>Rule name<input value={rule.title} onChange={(event) => editRule(rule, { title: event.target.value })} /></label><div className="rule-details"><label>Medication<input value={rule.medicationId ?? ""} onChange={(event) => editRule(rule, { medicationId: event.target.value || null })} /></label><label>Department<input value={rule.departmentId ?? ""} onChange={(event) => editRule(rule, { departmentId: event.target.value || null })} /></label><label>Restriction<input value={rule.restriction ?? ""} onChange={(event) => editRule(rule, { restriction: event.target.value || null })} /></label><label>Effective date<input value={rule.effectiveDate ?? ""} onChange={(event) => editRule(rule, { effectiveDate: event.target.value || null })} /></label><label>Approved alternative<input value={rule.approvedAlternativeId ?? ""} onChange={(event) => editRule(rule, { approvedAlternativeId: event.target.value || null })} /></label><div><span>When</span><p>{rule.condition}</p></div></div><blockquote><span>Source excerpt</span>{rule.sourceExcerpt}</blockquote><div className="rule-actions"><button className="primary-button" type="button" onClick={() => changeStatus(rule, "Confirmed")}>Confirm rule</button><button className="secondary-button" type="button" onClick={() => changeStatus(rule, "Draft")}>{rule.status === "Confirmed" ? "Reopen as draft" : "Keep as draft"}</button><button className="text-button danger-button" type="button" onClick={() => changeStatus(rule, "Rejected")}>Reject</button></div></article>)}</div></section>}
  </section>;
}
