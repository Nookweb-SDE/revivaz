import React from "react";
import ReactDOM from "react-dom/client";
import ContaApp from "./ContaApp";
import { armarRecuperacao } from "../lib/recuperaAtualizacao";

armarRecuperacao();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ContaApp /></React.StrictMode>
);
