import React from "react";
import ReactDOM from "react-dom/client";
import Termos from "./Termos";
import { armarRecuperacao } from "../lib/recuperaAtualizacao";

armarRecuperacao();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><Termos /></React.StrictMode>
);
