import { Link } from "react-router-dom";
import { StatePanel } from "../components/StatePanel";

export function NotFoundPage() {
  return <section className="fallback-page"><p className="eyebrow">Page unavailable</p><StatePanel kind="error" title="This demo page could not be found." message="Check the link or return to the Overview to continue the fictional demo workflow." action={<Link className="button button--primary" to="/">Return to Overview</Link>} /></section>;
}
