import React, { useEffect, useState } from "react";
import { FileText, Pill, Send, CheckCircle2 } from "lucide-react";
import { T, card, sectionTitle, btnPrimary } from "../../conta/ui";
import { profMinhaAgenda, profLancarReceita, getReceitas } from "../../lib/data";
import type { Consulta } from "../../lib/types";

/* ── helpers ──────────────────────────────────────────────── */

function formatDate(iso: string | null): string {
  if (!iso) return "Sem data";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatHora(hora: string | null): string {
  if (!hora) return "";
  return hora.slice(0, 5);
}

/* ── sub-components ───────────────────────────────────────── */

function ConsultaIcon() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.teal100} 0%, ${T.teal300}33 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `1px solid ${T.teal300}55`,
      }}
    >
      <FileText size={20} color={T.teal700} strokeWidth={1.8} />
    </div>
  );
}

function ConsultaReceitaCard({
  consulta,
  jaLancada,
  onLancada,
}: {
  consulta: Consulta;
  jaLancada: boolean;
  onLancada: () => void;
}) {
  const [resumo, setResumo] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // A receita already exists for this consulta (persisted, survives reloads)
  // OR was just lançada in this session. Either way, show the "done" state and
  // never offer the form again — prevents duplicate receitas for one consulta.
  const lancada = jaLancada || done;

  const podeSalvar = resumo.trim().length > 0 && !saving;

  async function handleLancar() {
    if (resumo.trim().length === 0) {
      setErro("Escreva um resumo antes de lançar.");
      return;
    }
    setSaving(true);
    setErro(null);
    try {
      await profLancarReceita({
        consulta_id: consulta.id,
        paciente_id: consulta.paciente_id,
        resumo: resumo.trim(),
      });
      setResumo("");
      setDone(true);
      onLancada();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível lançar a receita. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      aria-label={`Lançar receita da consulta de ${formatDate(consulta.data)}`}
      style={{
        ...card,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Accent strip */}
      <div
        aria-hidden="true"
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${T.teal500} 0%, ${T.teal300} 100%)`,
        }}
      />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <ConsultaIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: T.gray950,
                lineHeight: 1.3,
              }}
            >
              Consulta realizada
            </div>
            <div
              style={{
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                color: T.gray600,
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Pill size={11} color={T.teal500} aria-hidden="true" />
              {formatDate(consulta.data)}
              {formatHora(consulta.hora) ? ` · ${formatHora(consulta.hora)}` : ""}
              {" · "}
              {consulta.tipo === "online" ? "Online" : "Presencial"}
            </div>
          </div>
        </div>

        {lancada ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: T.teal050,
              borderRadius: 10,
              padding: "12px 14px",
              borderLeft: `3px solid ${T.green500}`,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: T.gray700,
            }}
          >
            <CheckCircle2 size={16} color={T.green500} aria-hidden="true" />
            Receita lançada 💚
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor={`resumo-${consulta.id}`}
                style={{
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: T.gray700,
                }}
              >
                Resumo da receita
              </label>
              <textarea
                id={`resumo-${consulta.id}`}
                value={resumo}
                onChange={(e) => {
                  setResumo(e.target.value);
                  if (erro) setErro(null);
                }}
                disabled={saving}
                rows={4}
                placeholder="Ex.: Sertralina 50mg — 1 comprimido pela manhã por 30 dias…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 88,
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 13,
                  color: T.gray950,
                  lineHeight: 1.55,
                  background: T.gray050,
                  border: `1.5px solid ${T.gray200}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  outline: "none",
                  opacity: saving ? 0.7 : 1,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = T.teal500;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = T.gray200;
                }}
              />
            </div>

            {erro ? (
              <p
                role="alert"
                style={{
                  margin: 0,
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.red,
                }}
              >
                {erro}
              </p>
            ) : null}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleLancar}
                disabled={!podeSalvar}
                aria-label="Lançar receita"
                style={{
                  ...btnPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  minHeight: 40,
                  opacity: podeSalvar ? 1 : 0.55,
                  cursor: podeSalvar ? "pointer" : "not-allowed",
                  transition: "opacity 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (podeSalvar) {
                    (e.currentTarget as HTMLButtonElement).style.background = T.teal900;
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = T.teal700;
                }}
              >
                <Send size={14} aria-hidden="true" />
                {saving ? "Lançando…" : "Lançar receita"}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "36px 16px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: T.teal050,
          border: `1.5px dashed ${T.teal300}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileText size={24} color={T.teal300} strokeWidth={1.5} />
      </div>
      <div>
        <p
          style={{
            margin: "0 0 4px",
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 14,
            color: T.gray700,
          }}
        >
          Nenhuma consulta realizada
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray600,
          }}
        >
          Marque uma consulta como realizada na sua agenda para lançar a receita aqui.
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        ...card,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: T.gray100,
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 12, width: "45%", borderRadius: 6, background: T.gray100 }} />
          <div style={{ height: 10, width: "65%", borderRadius: 6, background: T.gray100 }} />
        </div>
      </div>
      <div style={{ height: 72, borderRadius: 10, background: T.gray100 }} />
    </div>
  );
}

/* ── main export ──────────────────────────────────────────── */

export default function MinhasReceitas(): JSX.Element {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  // consulta_ids that already have a receita lançada (RLS: professional's own)
  const [comReceita, setComReceita] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const [agenda, receitas] = await Promise.all([
        profMinhaAgenda(),
        getReceitas(),
      ]);
      setConsultas(agenda.filter((c) => c.status === "realizada"));
      setComReceita(
        new Set(
          receitas
            .map((r) => r.consulta_id)
            .filter((id): id is string => !!id),
        ),
      );
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar suas consultas.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <section aria-label="Lançar receitas">
      <h2 style={sectionTitle}>Lançar receitas</h2>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : erro ? (
        <div style={{ ...card }}>
          <div
            role="alert"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "20px 12px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: T.red,
              }}
            >
              {erro}
            </p>
            <button
              onClick={() => void carregar()}
              style={{
                ...btnPrimary,
                padding: "10px 18px",
                fontSize: 13,
                minHeight: 40,
              }}
            >
              Tentar de novo
            </button>
          </div>
        </div>
      ) : consultas.length === 0 ? (
        <div style={{ ...card, padding: 0 }}>
          <EmptyState />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {consultas.map((c) => (
            <ConsultaReceitaCard
              key={c.id}
              consulta={c}
              jaLancada={comReceita.has(c.id)}
              onLancada={() => {
                // Recarrega para refletir a receita recém-lançada (e impedir
                // novo lançamento na mesma consulta após reload/troca de aba).
                void carregar();
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
