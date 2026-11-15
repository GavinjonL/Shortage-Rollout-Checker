import { useMemo, useState } from "react";
import { useActivity } from "../context/ActivityContext";
import { StatePanel } from "../components/StatePanel";

export function ActivityHistoryPage() {
  const { activities } = useActivity();
  const [feature, setFeature] = useState("All features");
  const [action, setAction] = useState("All actions");
  const features = [...new Set(activities.map((entry) => entry.feature))];
  const actions = [...new Set(activities.map((entry) => entry.action))];
  const filteredActivities = useMemo(() => activities.filter((entry) => (feature === "All features" || entry.feature === feature) && (action === "All actions" || entry.action === action)), [activities, feature, action]);

  return <section className="activity-page"><header className="page-header"><div><p className="eyebrow">Activity history</p><h1>Trace the review history.</h1><p className="page-intro">This activity record captures reviewer actions.</p></div><div className="read-only-label">Review activity</div></header><section className="activity-filters" aria-label="Activity History filters"><label>Feature<select value={feature} onChange={(event) => setFeature(event.target.value)}><option>All features</option>{features.map((item) => <option key={item}>{item}</option>)}</select></label><label>Action<select value={action} onChange={(event) => setAction(event.target.value)}><option>All actions</option>{actions.map((item) => <option key={item}>{item}</option>)}</select></label><span>{filteredActivities.length} activity records shown</span></section><section className="activity-timeline" aria-label="Activity timeline">{filteredActivities.length === 0 ? <StatePanel kind="empty" title="No matching activity." message="Try a different filter, or complete a local review action to add a new entry." /> : filteredActivities.map((entry) => <article key={entry.id} className="activity-entry"><time>{entry.timestamp}</time><div className="activity-entry__marker" aria-hidden="true" /><div><div className="activity-entry__heading"><strong>{entry.action}</strong><code>{entry.target}</code></div><p>{entry.detail}</p><span>{entry.actor} · {entry.feature}</span></div></article>)}</section></section>;
}
