export function EvidencePanel({ evidenceIds }: { evidenceIds: string[] }) { return <aside><h2>Evidence</h2><ul>{evidenceIds.map(id => <li key={id}>{id}</li>)}</ul></aside>; }
