import React from "react";
import ReactDOM from "react-dom/client";
import AcolhimentoChat from "./AcolhimentoChat";
import { armarRecuperacao } from "../lib/recuperaAtualizacao";

armarRecuperacao();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><AcolhimentoChat /></React.StrictMode>
);
