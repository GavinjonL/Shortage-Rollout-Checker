import { useEffect, useState } from "react";
import { createShadowFollowUp, fetchShadowFindings, saveShadowReview, type ShadowFinding } from "../api/client";
import { useDemo } from "../context/DemoContext";
import { PolicyConfirmationGate } from "../components/PolicyConfirmationGate";

export function ShadowModePage() {
  const { isPolicyConfirmed } = useDemo(); const [finding, setFinding] = useState<ShadowFinding | null>(null); const [note, setNote] = useState(""); const [notice, setNotice] = useState("");
  const load = () => fetchShadowFindings().then(data => setFinding(data.findings[0] ?? null)).catch((e: Error) => setNotice(e.message));
  useEffect(() => { if (isPolicyConfirmed) load(); }, [isPolicyConfirmed]);
  if (!isPolicyConfirmed) return <PolicyConfirmationGate feature="Shadow Mode" />;
  return <section className="shadow-page"><header className="page-header"><div><p className="eyebrow">Shadow Mode</p><h1>Observe patterns without changing orders</h1><p className="page-intro">Read-only event monitoring.</p></div><div className="read-only-label">Read-only</div></header>{finding ? <div className="shadow-layout"><section className="pattern-card"><h2>{finding.summary}</h2><p>{finding.reason}</p><p>{finding.event_count} events · {finding.time_window.hours}-hour window</p><p>Evidence: {finding.evidence_ids.join(" · ")}</p><blockquote>{finding.source_excerpt}</blockquote></section><aside className="shadow-review"><h2>Pharmacist review</h2><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional review note" />{["Expected", "Dismissed", "Review policy"].map(status => <button className="button button--secondary" key={status} onClick={() => saveShadowReview(finding.id, status, note).then(() => { setNotice(`Saved ${status}.`); load(); })}>{status}</button>)}<button className="primary-button" onClick={() => createShadowFollowUp(finding.id).then(() => setNotice("Confirmed follow-up case created for Flight Simulator."))}>Create follow-up test case</button></aside></div> : <p>No event findings are available.</p>}<p role="status">{notice}</p></section>;
}
