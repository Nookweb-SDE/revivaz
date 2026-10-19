import React from "react";
import ReactDOM from "react-dom/client";
import ContaApp from "./ContaApp";
import { AvisoCookies } from "../legal/AvisoCookies";
import { armarRecuperacao } from "../lib/recuperaAtualizacao";

armarRecuperacao();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ContaApp /><AvisoCookies /></React.StrictMode>
);
