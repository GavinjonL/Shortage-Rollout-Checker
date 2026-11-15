import { useEffect, useMemo, useState } from "react";
import { fetchRolloutFindings, type RolloutRuleReview } from "../api/client";
import type { RolloutFinding } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { useActivity } from "../context/ActivityContext";
import { useDemo } from "../context/DemoContext";
import { PolicyConfirmationGate } from "../components/PolicyConfirmationGate";

const reviewOptions = ["Needs review", "Expected", "Dismissed"];
const initialDepartment = "All departments";
const initialSystem = "All systems";
const initialStatus = "All statuses";

export function RolloutReviewPage() {
  const { recordActivity } = useActivity();
  const { rules, isPolicyConfirmed } = useDemo();
  const [findings, setFindings] = useState<RolloutFinding[]>([]);
  const [systemConfigRecords, setConfigs] = useState<Array<{ id: string; department: string; systemType: string; medication: string; instructionText: string; state: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ruleReviews, setRuleReviews] = useState<RolloutRuleReview[]>([]);
  const [fingerprint, setFingerprint] = useState("");
  const [coverage, setCoverage] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    setFindings([]); setConfigs([]); setLoading(true); setError("");
    if (!isPolicyConfirmed) return;
    fetchRolloutFindings().then(data => {
      if (!active) return;
      setFindings(data.findings.map(f => ({ ...f, department: f.department_id, systemType: f.system_type, policyRuleId: f.policy_rule_id, sourceRecordId: f.source_record_id, evidenceSummary: f.instruction_text })));
      setConfigs(data.configurations.map(c => ({ id: c.source_record_id, department: c.department_id, systemType: c.system_type, medication: c.medication_id, instructionText: c.instruction_text, state: data.rule_reviews.flatMap(review => review.records).find(record => record.source_record_id === c.source_record_id && record.outcome === "Possible mismatch")?.outcome ?? data.rule_reviews.flatMap(review => review.records).find(record => record.source_record_id === c.source_record_id)?.outcome ?? "Not evaluated" })));
      setCoverage(data.coverage_notes); setRuleReviews(data.rule_reviews); setFingerprint(data.policy_fingerprint);
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rules, isPolicyConfirmed]);
  const [department, setDepartment] = useState(initialDepartment);
  const [system, setSystem] = useState(initialSystem);
  const [status, setStatus] = useState(initialStatus);
  const [selectedId, setSelectedId] = useState("");
  const [note, setNote] = useState("");

  const filteredFindings = useMemo(() => findings.filter((finding) => (
    (department === initialDepartment || finding.department === department)
    && (system === initialSystem || finding.systemType === system)
    && (status === initialStatus || finding.review_status === status)
  )), [findings, department, system, status]);
  const selectedFinding = filteredFindings.find((finding) => finding.id === selectedId) ?? filteredFindings[0];
  const departments = [...new Set(findings.map((finding) => finding.department))];
  const systems = [...new Set(findings.map((finding) => finding.systemType))];
  const needsReviewCount = findings.filter((finding) => finding.review_status === "Needs review").length;
  const reviewedCount = findings.filter((finding) => finding.review_status !== "Needs review").length;
  const clarificationCount = ruleReviews.filter(review => review.outcome === "Needs clarification" || review.outcome === "No matching records" || review.outcome === "Not evaluated").length;
  const checkedRecordCount = new Set(ruleReviews.flatMap(review => review.records.map(record => record.configuration_id))).size;
  const hasFilters = department !== initialDepartment || system !== initialSystem || status !== initialStatus;

  if (!isPolicyConfirmed) return <PolicyConfirmationGate feature="Rollout Review" />;
  if (loading) return <p role="status">Loading rollout comparisons from the backend...</p>;
  if (error) return <p role="alert">{error}</p>;

  function updateStatus(findingId: string, reviewStatus: string) {
    const finding = findings.find((item) => item.id === findingId);
    setFindings(current => current.map(item => item.id === findingId ? { ...item, review_status: reviewStatus } : item));
    if (finding) recordActivity({ actor: "Pharmacist reviewer", feature: "Rollout Review", action: `Marked finding ${reviewStatus}`, target: findingId, detail: note || finding.summary });
    setNote("");
  }

  function showPolicyChecks() {
    const details = document.getElementById("policy-check-details") as HTMLDetailsElement | null;
    if (details) { details.open = true; details.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  function clearFilters() { setDepartment(initialDepartment); setSystem(initialSystem); setStatus(initialStatus); }

  function exportChecklist() {
    const headers = ["Finding ID", "Severity", "Review status", "Department", "System type", "Policy rule", "Source record", "Summary", "Created at"];
    const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = filteredFindings.map((finding) => [finding.id, finding.severity, finding.review_status, finding.department, finding.systemType, finding.policyRuleId, finding.sourceRecordId, finding.summary, finding.created_at].map(csvCell).join(","));
    const file = new Blob([[headers.map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rollout-review-checklist.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <section className="review-page" aria-labelledby="review-title">
    <header className="page-header"><div><p className="eyebrow">Rollout review</p><h1 id="review-title">Check every mock system record.</h1><p className="page-intro">Possible mismatches are evidence for pharmacist review. No configuration is changed by this demo.</p></div><div className="read-only-label">Read-only review</div></header>
    <section className="review-summary" aria-label="Finding summary"><article><span>Total findings</span><strong>{findings.length}</strong><p>Mock configuration comparisons</p></article><article className="review-summary__urgent"><span>Needs review</span><strong>{needsReviewCount}</strong><p>Require pharmacist attention</p></article><article><span>Reviewed</span><strong>{reviewedCount}</strong><p>Expected or dismissed</p></article></section>
    <div className="review-context">
      <p>{ruleReviews.length} confirmed {ruleReviews.length === 1 ? "rule" : "rules"} &middot; {checkedRecordCount} {checkedRecordCount === 1 ? "record" : "records"} checked</p>
      <a href="#policy-check-details" onClick={event => { event.preventDefault(); showPolicyChecks(); }}>View policy checks <span aria-hidden="true">&darr;</span></a>
    </div>
    {clarificationCount > 0 && <div className="review-clarification" role="status">
      <div><strong>{clarificationCount} {clarificationCount === 1 ? "rule needs" : "rules need"} clarification</strong><p>Some records do not provide enough detail to verify the policy.</p></div>
      <button type="button" className="button button--secondary" onClick={showPolicyChecks}>See details</button>
    </div>}
    <section className="review-filter-panel" aria-label="Finding filters"><div className="review-filter-heading"><div><p className="eyebrow">Find findings faster</p><h2>Filter the review queue</h2></div><div className="review-export-actions"><button className="text-button" type="button" disabled={!hasFilters} onClick={clearFilters}>Clear filters</button><button className="button button--secondary" type="button" onClick={exportChecklist}>Download CSV</button><button className="button button--secondary" type="button" onClick={() => window.print()}>Print checklist</button></div></div><div className="review-filters"><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option>{initialDepartment}</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><label>System type<select value={system} onChange={(event) => setSystem(event.target.value)}><option>{initialSystem}</option>{systems.map((item) => <option key={item}>{item}</option>)}</select></label><label>Review status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>{initialStatus}</option>{reviewOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div><p className="filter-result-count">Showing <strong>{filteredFindings.length}</strong> of {findings.length} findings</p></section>
    <div className="review-layout"><section className="review-list" aria-labelledby="review-findings-heading"><div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="review-findings-heading">Possible mismatches</h2></div><span className="queue-label">Select a finding to inspect evidence</span></div>{filteredFindings.length === 0 ? <div className="empty-state"><strong>{hasFilters ? "No findings match these filters." : "No possible mismatches found."}</strong><span>{clarificationCount ? "Some rules still need clarification. See the policy checks below." : "These limited checks do not establish full policy compliance."}</span></div> : filteredFindings.map((finding) => <FindingRow key={finding.id} finding={finding} selected={finding.id === selectedFinding?.id} onSelect={() => setSelectedId(finding.id)} />)}</section>{selectedFinding && <aside className="evidence-detail" aria-labelledby="evidence-heading"><p className="eyebrow">Selected finding</p><h2 id="evidence-heading">{selectedFinding.summary}</h2><div className="evidence-tags"><StatusBadge status={selectedFinding.severity} /><StatusBadge status={selectedFinding.review_status} /></div><dl><div><dt>Policy rule</dt><dd>{selectedFinding.policyRuleId}</dd></div><div><dt>Source record</dt><dd>{selectedFinding.sourceRecordId}</dd></div><div><dt>Department</dt><dd>{selectedFinding.department}</dd></div><div><dt>System</dt><dd>{selectedFinding.systemType}</dd></div></dl><p className="evidence-copy">{selectedFinding.evidenceSummary}</p><label className="note-field">Optional review note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for the demo activity history" rows={3} /></label><div className="review-actions">{reviewOptions.map((option) => <button key={option} type="button" className={selectedFinding.review_status === option ? "button button--primary" : "button button--secondary"} onClick={() => updateStatus(selectedFinding.id, option)}>{option}</button>)}</div></aside>}</div>
    <details className="policy-check-details" id="policy-check-details">
      <summary><span><strong>Policy checks</strong><span>Source text, records checked, and results for each rule</span></span><span className="policy-check-details__count">{ruleReviews.length} {ruleReviews.length === 1 ? "rule" : "rules"}</span></summary>
      <div className="policy-check-details__body">
        {ruleReviews.map(review => <article className="policy-check" key={review.rule.id}>
          <div className="policy-check__heading"><div><h3>{review.rule.medication_id}</h3><p>{review.rule.department_id} &middot; Effective {review.rule.effective_date}</p></div><StatusBadge status={review.outcome} /></div>
          <dl className="policy-check__facts"><div><dt>Requirement</dt><dd>{review.rule.restriction}</dd></div><div><dt>Condition</dt><dd>{review.rule.condition}</dd></div></dl>
          <blockquote><span>Policy source</span>{review.rule.source_excerpt}</blockquote>
          {review.records.length === 0 ? <p className="field-help">{review.reason}</p> : <div className="policy-check__records">{review.records.map(record => <div className="policy-check__record" key={record.configuration_id}>
            <div className="policy-check__record-heading"><strong>{record.source_record_id}</strong><StatusBadge status={record.outcome} /></div>
            <p>{record.instruction_text}</p><p className="field-help">{record.reason}</p>
          </div>)}</div>}
        </article>)}
        <details className="policy-check-method"><summary>How these checks work</summary>{coverage.map(note => <p key={note}>{note}</p>)}<p>Review reference: <code>{fingerprint.slice(0, 16)}</code></p></details>
      </div>
    </details>
    <section className="config-section" aria-labelledby="config-heading"><div className="section-heading"><div><p className="eyebrow">Mock configuration</p><h2 id="config-heading">Mock system records</h2></div></div><div className="config-table-wrap"><table><thead><tr><th>Record</th><th>Department</th><th>System</th><th>Medication</th><th>Instruction</th><th>State</th></tr></thead><tbody>{systemConfigRecords.map((record) => <tr key={record.id}><td>{record.id}</td><td>{record.department}</td><td>{record.systemType}</td><td>{record.medication}</td><td>{record.instructionText}</td><td><StatusBadge status={record.state} /></td></tr>)}</tbody></table></div></section>
  </section>;
}

function FindingRow({ finding, selected, onSelect }: { finding: RolloutFinding; selected: boolean; onSelect: () => void }) {
  return <button className={`finding-row ${selected ? "finding-row--selected" : ""}`} type="button" onClick={onSelect}><span className="finding-row__topline"><span className="finding-row__feature">{finding.department} · {finding.systemType}</span><StatusBadge status={finding.severity} /></span><strong>{finding.summary}</strong><span className="finding-row__reason">Rule {finding.policyRuleId} · Record {finding.sourceRecordId}</span><span className="finding-row__footer"><span>{finding.id}</span><StatusBadge status={finding.review_status} /></span></button>;
}
