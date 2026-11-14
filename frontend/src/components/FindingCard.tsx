import type { Finding } from "../types";
import { StatusBadge } from "./StatusBadge";

export function FindingCard({ finding }: { finding: Finding }) {
  return <article className="finding-card"><div className="finding-card__meta"><span>{finding.feature}</span><StatusBadge status={finding.severity} /></div><h3>{finding.summary}</h3><div className="finding-card__footer"><span>{finding.id}</span><StatusBadge status={finding.review_status} /></div></article>;
}
