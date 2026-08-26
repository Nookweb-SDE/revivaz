/**
 * Autocuidado guiado.
 *
 * Este arquivo tinha 1081 linhas com quatro telas dentro. Agora é só a
 * orquestração de qual tela aparece.
 *   _lib/autocuidadoDados.ts  → protocolos 4-7-8 e 5-4-3-2-1 (com teste)
 *   AutocuidadoTopbar.tsx      → barra de topo compartilhada
 *   TelaSelecao.tsx · TelaRespiracao.tsx · TelaGrounding.tsx
 */
import React, { useState } from "react";
import { T, card, sectionTitle } from "../ui";
import { Leaf } from "lucide-react";
import TelaSelecao from "./TelaSelecao";
import TelaRespiracao from "./TelaRespiracao";
import TelaGrounding from "./TelaGrounding";
import type { Tela } from "./_lib/autocuidadoDados";

// ─── Export principal ─────────────────────────────────────────────────────────

export default function Autocuidado({
  onFechar,
}: {
  onFechar: () => void;
}): JSX.Element {
  const [tela, setTela] = useState<Tela>("selecao");

  return (
    // Negative horizontal margin to bleed the green background to container edges;
    // re-applies the same padding inside. Matches AppShell's paddingLeft/Right: 16.
    <section
      aria-label="Autocuidado — técnicas guiadas"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        margin: "-20px -16px -80px",
        padding: "20px 16px 80px",
        minHeight: "100vh",
        background: "#f0fdf4",
      }}
    >
      {tela === "selecao" && (
        <TelaSelecao
          onRespiracao={() => setTela("respiracao")}
          onGrounding={() => setTela("grounding")}
          onFechar={onFechar}
        />
      )}
      {tela === "respiracao" && (
        <TelaRespiracao onVoltar={() => setTela("selecao")} />
      )}
      {tela === "grounding" && (
        <TelaGrounding onVoltar={() => setTela("selecao")} />
      )}
    </section>
  );
}
