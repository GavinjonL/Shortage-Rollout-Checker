import { useEffect, useState } from "react";
import { fetchShadowAnalysis, reviewShadowFinding, type ShadowApiFinding, type ShadowApiEvent } from "../api/client";
import { useActivity } from "../context/ActivityContext";
import { useDemo } from "../context/DemoContext";
import { PolicyConfirmationGate } from "../components/PolicyConfirmationGate";
import { StatePanel } from "../components/StatePanel";

type ReviewStatus = "Expected" | "Dismissed" | "Review policy";

export function ShadowModePage() {
  const { recordActivity } = useActivity();
  const { isPolicyConfirmed } = useDemo();
  const [events, setEvents] = useState<ShadowApiEvent[]>([]);
  const [findings, setFindings] = useState<ShadowApiFinding[]>([]);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("Review policy");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPolicyConfirmed) return;
    fetchShadowAnalysis().then((analysis) => { setEvents(analysis.events); setFindings(analysis.findings); }).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to analyze fictional events."));
  }, [isPolicyConfirmed]);

  if (!isPolicyConfirmed) return <PolicyConfirmationGate feature="Shadow Mode" />;
  if (error) return <StatePanel kind="error" title="Shadow analysis unavailable" message={error} />;
  if (!findings.length && !events.length) return <StatePanel kind="loading" title="Analyzing fictional events" message="Comparing the shared event stream with confirmed policy rules." />;
  const finding = findings[0];
  async function saveReview() {
    if (!finding) return;
    try { await reviewShadowFinding(finding.id, reviewStatus, note); recordActivity({ actor: "Pharmacist reviewer", feature: "Shadow Mode", action: `Marked pattern ${reviewStatus}`, target: finding.id, detail: note || finding.summary }); setNotice(`Review saved as “${reviewStatus}”.`); }
    catch (saveError) { setNotice(saveError instanceof Error ? saveError.message : "Unable to save the review."); }
  }

  return <section className="shadow-page" aria-labelledby="shadow-title"><div className="page-heading"><div><p className="eyebrow">Shadow Mode</p><h1 id="shadow-title">Observe patterns without changing orders</h1><p className="page-intro">The shared fictional event stream is compared deterministically with confirmed policy rules. No live order is changed.</p></div><div className="read-only-label">Read-only · Demo data</div></div><div className="shadow-banner" role="note"><strong>Observation only.</strong> Shadow Mode is a read-only review of supplied fictional events.</div><div className="shadow-summary-grid"><article><span>Review window</span><strong>24 hours</strong><p>Shared backend analysis</p></article><article><span>Events observed</span><strong>{events.length}</strong><p>Fictional supplied records</p></article><article><span>Repeated patterns</span><strong>{findings.length}</strong><p>Require human review</p></article></div>{finding ? <div className="shadow-layout"><section className="pattern-card" aria-labelledby="pattern-title"><div className="card-heading"><div><p className="step-label">Repeated deviation</p><h2 id="pattern-title">{finding.summary}</h2></div><span className="shadow-status">{finding.review_status}</span></div><p className="pattern-copy">{finding.reason}</p><div className="pattern-details"><div><span>Policy comparison</span><strong>{finding.policy_rule_id}</strong></div><div><span>Grouped by</span><strong>{finding.department_id} · {finding.event_type} · {finding.time_window.hours}-hour window</strong></div><div><span>Representative events</span><strong>{finding.evidence_ids.join(", ")}</strong></div></div><div className="source-event-strip"><span>Source excerpt</span><p>{finding.source_excerpt}</p></div></section><aside className="shadow-review" aria-label="Review controls"><p className="step-label">Pharmacist review</p><h2>Record a demo decision</h2><p>This review is saved to the fictional backend session and Activity History.</p><div className="shadow-actions">{(["Expected", "Dismissed", "Review policy"] as ReviewStatus[]).map((option) => <button className={reviewStatus === option ? "button button--primary" : "button button--secondary"} type="button" key={option} onClick={() => setReviewStatus(option)}>{option}</button>)}</div><label className="note-field" htmlFor="shadow-note">Review note<textarea id="shadow-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional rationale for the demo…" rows={4} /></label><button className="primary-button" type="button" onClick={saveReview}>Save review status</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</aside></div> : <StatePanel kind="empty" title="No repeated pattern found" message="The current shared fictional event stream did not create a repeated deviation." />}<section className="event-stream" aria-labelledby="event-stream-title"><div className="section-heading"><div><p className="step-label">Supplied event stream</p><h2 id="event-stream-title">Recent fictional events</h2></div><p>Source IDs are shown for traceability.</p></div><div className="event-table-wrap"><table><thead><tr><th>Time</th><th>Event ID</th><th>Department</th><th>Event type</th><th>Result</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.timestamp}</td><td><strong>{event.id}</strong></td><td>{event.department_id}</td><td>{event.event_type}</td><td>{event.result}</td></tr>)}</tbody></table></div></section></section>;
}
