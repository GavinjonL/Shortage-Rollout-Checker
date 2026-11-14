import { Outlet } from "react-router-dom";
import { Navigation } from "../components/Navigation";

export function App() {
  return <><Navigation /><main><Outlet /></main></>;
}
