/**
 * Histórico do paciente, aberto de dentro do Atendimento.
 * Movido verbatim do Atendimento.tsx na decomposição.
 */
import React, { useEffect, useState, useCallback } from "react";
import { T, card, btnPrimary, btnGhost } from "../../conta/ui";
import type { Consulta, Receita } from "../../lib/types";
import { shortId, badgeStyle, formatDataHora } from "./_lib/atendimentoUtils";
import { profHistoricoPaciente } from "../../lib/data";

// ---------------------------------------------------------------------------
// Histórico modal
// ---------------------------------------------------------------------------

function HistoricoModal({
  pacienteId,
  pacienteNome,
  onFechar,
}: {
  pacienteId: string;
  pacienteNome: string;
  onFechar: () => void;
}) {
  const [dados, setDados] = useState<{ consultas: Consulta[]; receitas: Receita[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await profHistoricoPaciente(pacienteId));
    } catch (e) {
      setDados({ consultas: [], receitas: [] });
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o histórico.");
    }
  }, [pacienteId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onFechar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Histórico de ${pacienteNome}`}
      onClick={onFechar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          borderRadius: "18px 18px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 32px rgba(15,23,42,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 18px",
            borderBottom: `1px solid ${T.gray100}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: T.gray950,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {pacienteNome}
            </div>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: T.gray600 }}>
              Histórico clínico
            </div>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar histórico"
            style={{ ...btnGhost, padding: "8px 12px", minHeight: 40, color: T.gray600 }}
          >
            Fechar
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
          {dados === null ? (
            <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600, textAlign: "center", padding: 24 }}>
              Carregando histórico…
            </p>
          ) : erro ? (
            <div role="alert" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
              <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.red }}>{erro}</p>
              <button onClick={() => void carregar()} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, minHeight: 38 }}>
                Tentar de novo
              </button>
            </div>
          ) : (
            <>
              <section aria-label="Consultas anteriores">
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, color: T.gray700 }}>
                  Consultas ({dados.consultas.length})
                </h4>
                {dados.consultas.length === 0 ? (
                  <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
                    Nenhuma consulta registrada.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dados.consultas.map((c) => (
                      <div key={c.id} style={{ background: T.gray050, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={badgeStyle(c.status)}>{c.status}</span>
                          <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray600 }}>
                            {formatDataHora(c) ?? "Sem data"}
                          </span>
                        </div>
                        {c.obs && (
                          <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray700, lineHeight: 1.5 }}>
                            <strong>Paciente:</strong> {c.obs}
                          </p>
                        )}
                        {c.obs_profissional && (
                          <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 12, color: T.gray700, lineHeight: 1.5 }}>
                            <strong>Anotação:</strong> {c.obs_profissional}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section aria-label="Receitas anteriores">
                <h4 style={{ margin: "0 0 8px", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, color: T.gray700 }}>
                  Receitas ({dados.receitas.length})
                </h4>
                {dados.receitas.length === 0 ? (
                  <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
                    Nenhuma receita registrada.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dados.receitas.map((r) => (
                      <div key={r.id} style={{ background: T.teal050, borderRadius: 10, padding: "10px 12px", borderLeft: `3px solid ${T.teal500}` }}>
                        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: T.gray600, marginBottom: 4 }}>
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </div>
                        <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray950, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {r.resumo}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Emitir Receita Modal
// ---------------------------------------------------------------------------

export default HistoricoModal;
