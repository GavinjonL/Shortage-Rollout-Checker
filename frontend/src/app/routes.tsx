import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { OverviewPage } from "../pages/OverviewPage";
import { PolicySetupPage } from "../pages/PolicySetupPage";
import { RolloutReviewPage } from "../pages/RolloutReviewPage";
import { FlightSimulatorPage } from "../pages/FlightSimulatorPage";
import { RippleMapPage } from "../pages/RippleMapPage";
import { ShadowModePage } from "../pages/ShadowModePage";
import { ActivityHistoryPage } from "../pages/ActivityHistoryPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([{ element: <App />, children: [
  { path: "/", element: <OverviewPage /> }, { path: "/policy", element: <PolicySetupPage /> },
  { path: "/rollout", element: <RolloutReviewPage /> }, { path: "/simulator", element: <FlightSimulatorPage /> },
  { path: "/ripple", element: <RippleMapPage /> }, { path: "/shadow", element: <ShadowModePage /> },
  { path: "/activity", element: <ActivityHistoryPage /> }, { path: "*", element: <NotFoundPage /> }
] }]);
