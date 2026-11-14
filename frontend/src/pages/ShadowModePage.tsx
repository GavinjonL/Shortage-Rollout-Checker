import { useState } from "react";
import { useActivity } from "../context/ActivityContext";

type ReviewStatus = "Needs review" | "Expected" | "Dismissed" | "Review policy";

interface ShadowEvent {
  id: string;
  time: string;
  department: string;
  event: string;
  policyComparison: "Matches expected behavior" | "Included in repeated pattern" | "Not grouped";
}

const events: ShadowEvent[] = [
  { id: "EV-019", time: "09:12", department: "Emergency Department", event: "Orion order placed while shortage flag was active", policyComparison: "Included in repeated pattern" },
  { id: "EV-021", time: "10:04", department: "Emergency Department", event: "Orion order placed while shortage flag was active", policyComparison: "Included in repeated pattern" },
  { id: "EV-024", time: "11:18", department: "Emergency Department", event: "Orion order placed while shortage flag was active", policyComparison: "Included in repeated pattern" },
  { id: "EV-029", time: "12:42", department: "Infusion Center", event: "Approved alternative selected", policyComparison: "Matches expected behavior" },
  { id: "EV-033", time: "13:27", department: "Medical Surgical", event: "Order missing shortage-state input", policyComparison: "Not grouped" },
  { id: "EV-037", time: "14:10", department: "Emergency Department", event: "Orion order placed while shortage flag was active", policyComparison: "Included in repeated pattern" },
];

export function ShadowModePage() {
  const { recordActivity } = useActivity();
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("Needs review");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");

  function updateReview(status: ReviewStatus) {
    setReviewStatus(status);
    setNotice(`Selected “${status}”. Save the review to add it to Activity History.`);
  }

  function saveReview() {
    recordActivity({ actor: "Pharmacist reviewer", feature: "Shadow Mode", action: `Marked pattern ${reviewStatus}`, target: "F-106", detail: note || "Reviewed the Emergency Department workaround pattern." });
    setNotice(`Demo review status saved locally as “${reviewStatus}”.`);
  }

  return <section className="shadow-page" aria-labelledby="shadow-title">
    <div className="page-heading">
      <div><p className="eyebrow">Shadow Mode</p><h1 id="shadow-title">Observe patterns without changing orders</h1><p className="page-intro">Review fictional event patterns against confirmed policy behavior. This page is read-only and does not connect to a live clinical system.</p></div>
      <div className="read-only-label">Read-only · Demo data</div>
    </div>

    <div className="shadow-banner" role="note"><strong>Observation only.</strong> Events shown here are supplied fictional demo data. Shadow Mode never blocks, reroutes, or edits an order.</div>

    <div className="shadow-summary-grid">
      <article><span>Review window</span><strong>24 hours</strong><p>November 14, 2026</p></article>
      <article><span>Events observed</span><strong>{events.length}</strong><p>Fictional supplied records</p></article>
      <article><span>Repeated patterns</span><strong>1</strong><p>Requires pharmacist review</p></article>
    </div>

    <div className="shadow-layout">
      <section className="pattern-card" aria-labelledby="pattern-title">
        <div className="card-heading"><div><p className="step-label">Repeated deviation</p><h2 id="pattern-title">Emergency Department workaround pattern</h2></div><span className="shadow-status">{reviewStatus}</span></div>
        <p className="pattern-copy">Four fictional orders for Orion were recorded while the supplied shortage flag was active. The confirmed policy expects the approved alternative to be offered when the order qualifies.</p>
        <div className="pattern-details"><div><span>Policy comparison</span><strong>POL-01 · offer approved alternative when eligible</strong></div><div><span>Grouped by</span><strong>Department, event type, 24-hour window</strong></div><div><span>Representative events</span><strong>EV-019, EV-021, EV-024, EV-037</strong></div></div>
        <div className="source-event-strip"><span>Why this was flagged</span><p>Repeated events differ from the expected shortage-policy behavior in the supplied sample data. This is a possible mismatch for review, not a clinical conclusion.</p></div>
      </section>

      <aside className="shadow-review" aria-label="Review controls"><p className="step-label">Pharmacist review</p><h2>Record a demo decision</h2><p>Review actions are stored locally for this demo until a backend is connected.</p><div className="shadow-actions"><button className={reviewStatus === "Expected" ? "button button--primary" : "button button--secondary"} type="button" onClick={() => updateReview("Expected")}>Expected</button><button className={reviewStatus === "Dismissed" ? "button button--primary" : "button button--secondary"} type="button" onClick={() => updateReview("Dismissed")}>Dismiss</button><button className={reviewStatus === "Review policy" ? "button button--primary" : "button button--secondary"} type="button" onClick={() => updateReview("Review policy")}>Review policy</button></div><label className="note-field" htmlFor="shadow-note">Review note<textarea id="shadow-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional rationale for the demo…" rows={4} /></label><button className="primary-button" type="button" onClick={saveReview}>Save review status</button>{notice && <p className="inline-notice" role="status">{notice}</p>}</aside>
    </div>

    <section className="event-stream" aria-labelledby="event-stream-title"><div className="section-heading"><div><p className="step-label">Supplied event stream</p><h2 id="event-stream-title">Recent fictional events</h2></div><p>Source IDs are shown for traceability.</p></div><div className="event-table-wrap"><table><thead><tr><th>Time</th><th>Event ID</th><th>Department</th><th>Observed event</th><th>Policy comparison</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.time}</td><td><strong>{event.id}</strong></td><td>{event.department}</td><td>{event.event}</td><td><span className={`event-state event-state--${event.policyComparison === "Included in repeated pattern" ? "flagged" : event.policyComparison === "Matches expected behavior" ? "aligned" : "unmatched"}`}>{event.policyComparison}</span></td></tr>)}</tbody></table></div></section>
  </section>;
}
