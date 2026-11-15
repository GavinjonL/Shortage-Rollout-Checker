export type ReviewHistoryEntry = { id: string; timestamp: string; actor: string; action: string; detail: string };

type EvidencePanelProps = {
  title: string;
  policyExcerpt: string;
  sourceRecord: string;
  evidenceIds: string[];
  assumptions: string[];
  calculationInputs: Array<{ label: string; value: string }>;
  reviewHistory: ReviewHistoryEntry[];
};

export function EvidencePanel({ title, policyExcerpt, sourceRecord, evidenceIds, assumptions, calculationInputs, reviewHistory }: EvidencePanelProps) {
  return <section className="evidence-panel" aria-labelledby="full-evidence-heading">
    <div className="section-heading"><div><p className="eyebrow">Complete evidence record</p><h2 id="full-evidence-heading">{title}</h2></div></div>
    <div className="evidence-panel__grid">
      <article><h3>Policy excerpt</h3><blockquote>{policyExcerpt}</blockquote></article>
      <article><h3>Source record</h3><p>{sourceRecord}</p><p><strong>Evidence IDs:</strong> {evidenceIds.join(", ")}</p></article>
      <article><h3>Assumptions</h3><ul>{assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></article>
      <article><h3>Calculation inputs</h3><dl>{calculationInputs.map((input) => <div key={input.label}><dt>{input.label}</dt><dd>{input.value}</dd></div>)}</dl></article>
      <article className="evidence-panel__history"><h3>Review history</h3>{reviewHistory.length ? <ol>{reviewHistory.map((entry) => <li key={entry.id}><strong>{entry.action}</strong><span>{entry.timestamp} · {entry.actor}</span><p>{entry.detail}</p></li>)}</ol> : <p>No review action has been recorded for this finding.</p>}</article>
    </div>
  </section>;
}
