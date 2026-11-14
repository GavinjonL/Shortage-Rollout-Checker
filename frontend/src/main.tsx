import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { DemoProvider } from "./context/DemoContext";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find the app root element.");
}

createRoot(rootElement).render(
  <StrictMode>
    <DemoProvider><RouterProvider router={router} /></DemoProvider>
  </StrictMode>,
);
