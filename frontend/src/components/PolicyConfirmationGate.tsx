import { Link } from "react-router-dom";
import { useDemo } from "../context/DemoContext";
import { StatePanel } from "./StatePanel";

export function PolicyConfirmationGate({ feature }: { feature: string }) {
  const { confirmedRuleCount } = useDemo();
  return <section className="page-content__state"><StatePanel kind="empty" title="Confirm policy rules before continuing" message={`${feature} uses confirmed policy rules. ${confirmedRuleCount} rules are confirmed.`} action={<Link className="button button--primary" to="/policy">Open Policy Setup</Link>} /></section>;
}
