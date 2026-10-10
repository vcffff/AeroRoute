import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AeroRoutePage from "./shared/reference";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AeroRoutePage />
  </StrictMode>
);
