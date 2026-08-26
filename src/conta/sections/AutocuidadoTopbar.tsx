/**
 * Barra de topo compartilhada pelas telas de autocuidado.
 * Movida verbatim do Autocuidado.tsx na decomposição.
 */
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Leaf, Wind, X } from "lucide-react";
import { T, btnGhost, btnPrimary, card, sectionTitle } from "../ui";

// ─── Shared Topbar ────────────────────────────────────────────────────────────

function Topbar({
  titulo,
  onVoltar,
  voltarLabel = "Voltar",
}: {
  titulo: string;
  onVoltar: () => void;
  voltarLabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingBottom: 2,
      }}
    >
      <button
        type="button"
        aria-label={voltarLabel}
        onClick={onVoltar}
        style={{
          ...btnGhost,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 0",
          fontSize: 14,
          color: T.teal700,
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        {voltarLabel}
      </button>
      <h2
        style={{
          ...sectionTitle,
          margin: 0,
          flex: 1,
          textAlign: "right",
          fontSize: 14,
          fontWeight: 700,
          color: T.teal700,
        }}
      >
        {titulo}
      </h2>
    </div>
  );
}

export default Topbar;
