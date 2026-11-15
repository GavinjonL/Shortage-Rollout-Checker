import { useMemo, useState } from "react";
import { rolloutFindings, systemConfigRecords } from "../data/demoData";
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
  const { rolloutFindings: findings, updateFindingStatus, isPolicyConfirmed } = useDemo();
  const [department, setDepartment] = useState(initialDepartment);
  const [system, setSystem] = useState(initialSystem);
  const [status, setStatus] = useState(initialStatus);
  const [selectedId, setSelectedId] = useState(rolloutFindings[0].id);
  const [note, setNote] = useState("");

  const filteredFindings = useMemo(() => findings.filter((finding) => (
    (department === initialDepartment || finding.department === department)
    && (system === initialSystem || finding.systemType === system)
    && (status === initialStatus || finding.review_status === status)
  )), [findings, department, system, status]);
  const selectedFinding = filteredFindings.find((finding) => finding.id === selectedId) ?? filteredFindings[0] ?? findings[0];
  const departments = [...new Set(findings.map((finding) => finding.department))];
  const systems = [...new Set(findings.map((finding) => finding.systemType))];
  const needsReviewCount = findings.filter((finding) => finding.review_status === "Needs review").length;
  const reviewedCount = findings.filter((finding) => finding.review_status !== "Needs review").length;
  const hasFilters = department !== initialDepartment || system !== initialSystem || status !== initialStatus;

  if (!isPolicyConfirmed) return <PolicyConfirmationGate feature="Rollout Review" />;

  function updateStatus(findingId: string, reviewStatus: string) {
    const finding = findings.find((item) => item.id === findingId);
    updateFindingStatus(findingId, reviewStatus);
    if (finding) recordActivity({ actor: "Pharmacist reviewer", feature: "Rollout Review", action: `Marked finding ${reviewStatus}`, target: findingId, detail: note || finding.summary });
    setNote("");
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
    <header className="page-header"><div><p className="eyebrow">Rollout review</p><h1 id="review-title">Check each system record.</h1><p className="page-intro">Possible mismatches are evidence for pharmacist review. No configuration is changed by this workspace.</p></div><div className="read-only-label">Read-only review</div></header>
    <section className="review-summary" aria-label="Finding summary"><article><span>Total findings</span><strong>{findings.length}</strong><p>Configuration comparisons</p></article><article className="review-summary__urgent"><span>Needs review</span><strong>{needsReviewCount}</strong><p>Require pharmacist attention</p></article><article><span>Reviewed</span><strong>{reviewedCount}</strong><p>Expected or dismissed</p></article></section>
    <section className="review-filter-panel" aria-label="Finding filters"><div className="review-filter-heading"><div><p className="eyebrow">Find findings faster</p><h2>Filter the review queue</h2></div><div className="review-export-actions"><button className="text-button" type="button" disabled={!hasFilters} onClick={clearFilters}>Clear filters</button><button className="button button--secondary" type="button" onClick={exportChecklist}>Download CSV</button><button className="button button--secondary" type="button" onClick={() => window.print()}>Print checklist</button></div></div><div className="review-filters"><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option>{initialDepartment}</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><label>System type<select value={system} onChange={(event) => setSystem(event.target.value)}><option>{initialSystem}</option>{systems.map((item) => <option key={item}>{item}</option>)}</select></label><label>Review status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>{initialStatus}</option>{reviewOptions.map((item) => <option key={item}>{item}</option>)}</select></label></div><p className="filter-result-count">Showing <strong>{filteredFindings.length}</strong> of {findings.length} findings</p></section>
    <div className="review-layout"><section className="review-list" aria-labelledby="review-findings-heading"><div className="section-heading"><div><p className="eyebrow">Review queue</p><h2 id="review-findings-heading">Possible mismatches</h2></div><span className="queue-label">Select a finding to inspect evidence</span></div>{filteredFindings.length === 0 ? <div className="empty-state"><strong>No findings match these filters.</strong><span>Clear one or more filters to return to the full review queue.</span></div> : filteredFindings.map((finding) => <FindingRow key={finding.id} finding={finding} selected={finding.id === selectedFinding.id} onSelect={() => setSelectedId(finding.id)} />)}</section><aside className="evidence-detail" aria-labelledby="evidence-heading"><p className="eyebrow">Selected finding</p><h2 id="evidence-heading">{selectedFinding.summary}</h2><div className="evidence-tags"><StatusBadge status={selectedFinding.severity} /><StatusBadge status={selectedFinding.review_status} /></div><dl><div><dt>Policy rule</dt><dd>{selectedFinding.policyRuleId}</dd></div><div><dt>Source record</dt><dd>{selectedFinding.sourceRecordId}</dd></div><div><dt>Department</dt><dd>{selectedFinding.department}</dd></div><div><dt>System</dt><dd>{selectedFinding.systemType}</dd></div></dl><p className="evidence-copy">{selectedFinding.evidenceSummary}</p><label className="note-field">Optional review note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for the review history" rows={3} /></label><div className="review-actions">{reviewOptions.map((option) => <button key={option} type="button" className={selectedFinding.review_status === option ? "button button--primary" : "button button--secondary"} onClick={() => updateStatus(selectedFinding.id, option)}>{option}</button>)}</div></aside></div>
    <section className="config-section" aria-labelledby="config-heading"><div className="section-heading"><div><p className="eyebrow">Configuration</p><h2 id="config-heading">Affected system records</h2></div></div><div className="config-table-wrap"><table><thead><tr><th>Record</th><th>Department</th><th>System</th><th>Medication</th><th>Instruction</th><th>State</th></tr></thead><tbody>{systemConfigRecords.map((record) => <tr key={record.id}><td>{record.id}</td><td>{record.department}</td><td>{record.systemType}</td><td>{record.medication}</td><td>{record.instructionText}</td><td><StatusBadge status={record.state} /></td></tr>)}</tbody></table></div></section>
  </section>;
}

function FindingRow({ finding, selected, onSelect }: { finding: RolloutFinding; selected: boolean; onSelect: () => void }) {
  return <button className={`finding-row ${selected ? "finding-row--selected" : ""}`} type="button" onClick={onSelect}><span className="finding-row__topline"><span className="finding-row__feature">{finding.department} · {finding.systemType}</span><StatusBadge status={finding.severity} /></span><strong>{finding.summary}</strong><span className="finding-row__reason">Rule {finding.policyRuleId} · Record {finding.sourceRecordId}</span><span className="finding-row__footer"><span>{finding.id}</span><StatusBadge status={finding.review_status} /></span></button>;
}
