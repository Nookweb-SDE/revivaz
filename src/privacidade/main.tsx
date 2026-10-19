import React from "react";
import ReactDOM from "react-dom/client";
import Privacidade from "./Privacidade";
import { AvisoCookies } from "../legal/AvisoCookies";
import { armarRecuperacao } from "../lib/recuperaAtualizacao";

armarRecuperacao();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><Privacidade /><AvisoCookies /></React.StrictMode>
);
