import React from "react";
import { createRoot } from "react-dom/client";
import { ProfissionalApp } from "./ProfissionalApp";

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
createRoot(container).render(
  <React.StrictMode>
    <ProfissionalApp />
  </React.StrictMode>
);
