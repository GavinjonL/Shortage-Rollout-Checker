import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { ActivityProvider } from "./context/ActivityContext";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find the app root element.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ActivityProvider><RouterProvider router={router} /></ActivityProvider>
  </StrictMode>,
);
