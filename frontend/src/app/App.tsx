import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { EvidencePanel } from "../components/EvidencePanel";
import { useDemo } from "../context/DemoContext";

export function App() {
  const location = useLocation();
  const { activities } = useDemo();
  const showEvidence = location.pathname === "/rollout";
  const isHome = location.pathname === "/";
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><Navigation /><main id="main-content" className={`page-content${isHome ? " page-content--home" : ""}`} tabIndex={-1}><Outlet />{showEvidence && <EvidencePanel title="Rollout finding F-104" policyExcerpt="The fictional shortage policy requires current restriction guidance and the approved alternative for eligible orders." sourceRecord="EHR-204 is a order-set record that still permits routine use." evidenceIds={["POL-01", "EHR-204"]} assumptions={["EHR configuration", "Confirmed policy rule POL-01"]} calculationInputs={[{ label: "Comparison method", value: "Deterministic policy-to-configuration check" }, { label: "Department", value: "Infusion Center" }, { label: "System", value: "EHR order set" }]} reviewHistory={activities.filter((activity) => activity.target === "F-104")} />}</main></div>;
}
