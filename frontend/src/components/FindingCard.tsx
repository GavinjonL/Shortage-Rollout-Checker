import type { Finding } from "../types";
export function FindingCard({ finding }: { finding: Finding }) { return <article><h2>{finding.summary}</h2><p>{finding.review_status}</p></article>; }
