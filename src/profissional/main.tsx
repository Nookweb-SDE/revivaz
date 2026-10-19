import React from "react";
import { createRoot } from "react-dom/client";
import { ProfissionalApp } from "./ProfissionalApp";
import { AvisoCookies } from "../legal/AvisoCookies";
import { armarRecuperacao } from "../lib/recuperaAtualizacao";

armarRecuperacao();

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
createRoot(container).render(
  <React.StrictMode>
    <ProfissionalApp />
    <AvisoCookies />
  </React.StrictMode>
);
