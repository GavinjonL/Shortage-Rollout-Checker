import { Outlet } from "react-router-dom";
import { Navigation } from "../components/Navigation";

export function App() {
  return <div className="app-shell"><Navigation /><main className="page-content"><Outlet /></main></div>;
}
