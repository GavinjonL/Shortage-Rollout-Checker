import { useMemo, useState } from "react";
import { rolloutFindings, systemConfigRecords } from "../data/demoData";
import type { RolloutFinding } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { useActivity } from "../context/ActivityContext";
import { useDemo } from "../context/DemoContext";
import { PolicyConfirmationGate } from "../components/PolicyConfirmationGate";

const reviewOptions = ["Needs review", "Expected", "Dismissed"];

export function RolloutReviewPage() {
  const { recordActivity } = useActivity();
  const { rolloutFindings: findings, updateFindingStatus, isPolicyConfirmed } = useDemo();
  const [department, setDepartment] = useState("All departments");
  const [system, setSystem] = useState("All systems");
  const [status, setStatus] = useState("All statuses");
  const [selectedId, setSelectedId] = useState(rolloutFindings[0].id);
  const [note, setNote] = useState("");

  const filteredFindings = useMemo(() => findings.filter((finding) =>
    (department === "All departments" || finding.department === department)
    && (system === "All systems" || finding.systemType === system)
    && (status === "All statuses" || finding.review_status === status)), [findings, department, system, status]);
  const selectedFinding = findings.find((finding) => finding.id === selectedId) ?? findings[0];
  const departments = [...new Set(findings.map((finding) => finding.department))];
  const systems = [...new Set(findings.map((finding) => finding.systemType))];

  if (!isPolicyConfirmed) return <PolicyConfirmationGate feature="Rollout Review" />;

  function updateStatus(findingId: string, reviewStatus: string) {
    const finding = findings.find((item) => item.id === findingId);
    updateFindingStatus(findingId, reviewStatus);
    if (finding) recordActivity({ actor: "Pharmacist reviewer", feature: "Rollout Review", action: `Marked finding ${reviewStatus}`, target: findingId, detail: note || finding.summary });
    setNote("");
  }

  return <section className="review-page"><header className="page-header"><div><p className="eyebrow">Rollout review</p><h1>Check every mock system record.</h1><p className="page-intro">Possible mismatches are evidence for pharmacist review. No configuration is changed by this demo.</p></div><div className="read-only-label">Read-only review</div></header><section className="review-filters" aria-label="Finding filters"><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><label>System<select value={system} onChange={(event) => setSystem(event.target.value)}><option>All systems</option>{systems.map((item) => <option key={item}>{item}</option>)}</select></label><label>Review status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{reviewOptions.map((item) => <option key={item}>{item}</option>)}</select></label></section><div className="review-layout"><section className="review-list" aria-labelledby="review-findings-heading"><div className="section-heading"><div><p className="eyebrow">Findings</p><h2 id="review-findings-heading">{filteredFindings.length} records to review</h2></div></div>{filteredFindings.length === 0 ? <div className="empty-state">No findings match these filters.</div> : filteredFindings.map((finding) => <FindingRow key={finding.id} finding={finding} selected={finding.id === selectedId} onSelect={() => setSelectedId(finding.id)} />)}</section><aside className="evidence-detail" aria-labelledby="evidence-heading"><p className="eyebrow">Evidence detail</p><h2 id="evidence-heading">{selectedFinding.summary}</h2><div className="evidence-tags"><StatusBadge status={selectedFinding.severity} /><StatusBadge status={selectedFinding.review_status} /></div><dl><div><dt>Policy rule</dt><dd>{selectedFinding.policyRuleId}</dd></div><div><dt>Source record</dt><dd>{selectedFinding.sourceRecordId}</dd></div><div><dt>Department</dt><dd>{selectedFinding.department}</dd></div><div><dt>System</dt><dd>{selectedFinding.systemType}</dd></div></dl><p className="evidence-copy">{selectedFinding.evidenceSummary}</p><label className="note-field">Optional review note<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context for the demo activity history" rows={3} /></label><div className="review-actions">{reviewOptions.map((option) => <button key={option} className={selectedFinding.review_status === option ? "button button--primary" : "button button--secondary"} onClick={() => updateStatus(selectedFinding.id, option)}>{option}</button>)}</div></aside></div><section className="config-section" aria-labelledby="config-heading"><div className="section-heading"><div><p className="eyebrow">Mock configuration</p><h2 id="config-heading">Affected system records</h2></div></div><div className="config-table-wrap"><table><thead><tr><th>Record</th><th>Department</th><th>System</th><th>Medication</th><th>Instruction</th><th>State</th></tr></thead><tbody>{systemConfigRecords.map((record) => <tr key={record.id}><td>{record.id}</td><td>{record.department}</td><td>{record.systemType}</td><td>{record.medication}</td><td>{record.instructionText}</td><td><StatusBadge status={record.state} /></td></tr>)}</tbody></table></div></section></section>;
}

function FindingRow({ finding, selected, onSelect }: { finding: RolloutFinding; selected: boolean; onSelect: () => void }) {
  return <button className={`finding-row ${selected ? "finding-row--selected" : ""}`} onClick={onSelect}><span className="finding-row__feature">{finding.department} · {finding.systemType}</span><strong>{finding.summary}</strong><span className="finding-row__footer"><span>{finding.id}</span><StatusBadge status={finding.review_status} /></span></button>;
}
