import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "../components/Navigation";

export function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a><Navigation /><main id="main-content" className={`page-content${isHome ? " page-content--home" : ""}`} tabIndex={-1}><Outlet /></main></div>;
}
