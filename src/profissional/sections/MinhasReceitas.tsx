import React, { useEffect, useState } from "react";
import { FileText, Pill, Send, CheckCircle2 } from "lucide-react";
import { T, card, sectionTitle, btnPrimary } from "../../conta/ui";
import { profMinhaAgenda, profLancarReceita, getReceitas, getNomesPacientes } from "../../lib/data";
import type { Consulta } from "../../lib/types";

/* ── helpers ──────────────────────────────────────────────── */

function shortId(id: string): string {
  return id.slice(0, 8);
}

function nomeDoPaciente(c: Consulta, nomes: Record<string, string>): string {
  const n = nomes[c.paciente_id];
  if (n && n.trim() !== "") return n;
  return `Paciente #${shortId(c.paciente_id)}`;
}

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

/* ── form state ───────────────────────────────────────────── */

type FormState = {
  medicamento: string;
  dosagem: string;
  posologia: string;
  observacoes: string;
  validade: string;
};

const emptyForm = (): FormState => ({
  medicamento: "",
  dosagem: "",
  posologia: "",
  observacoes: "",
  validade: "",
});

function isFormValido(f: FormState): boolean {
  return (
    f.medicamento.trim().length > 0 &&
    f.dosagem.trim().length > 0 &&
    f.posologia.trim().length > 0 &&
    f.validade.length > 0
  );
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "'Nunito',sans-serif",
  fontSize: 13,
  color: T.gray950,
  lineHeight: 1.55,
  background: T.gray050,
  border: `1.5px solid ${T.gray200}`,
  borderRadius: 10,
  padding: "9px 12px",
  outline: "none",
};

function Field({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 700,
          fontSize: 12,
          color: T.gray700,
        }}
      >
        {label}
        {required && <span aria-hidden="true" style={{ color: T.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ConsultaReceitaCard({
  consulta,
  nome,
  jaLancada,
  onLancada,
}: {
  consulta: Consulta;
  nome: string;
  jaLancada: boolean;
  onLancada: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // A receita already exists for this consulta (persisted, survives reloads)
  // OR was just lançada in this session. Either way, show the "done" state and
  // never offer the form again — prevents duplicate receitas for one consulta.
  const lancada = jaLancada || done;

  const podeSalvar = isFormValido(form) && !saving;

  function patch(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (erro) setErro(null);
  }

  async function handleLancar() {
    if (!isFormValido(form)) {
      setErro("Preencha medicamento, dosagem, posologia e validade.");
      return;
    }
    setSaving(true);
    setErro(null);
    try {
      await profLancarReceita({
        consulta_id: consulta.id,
        paciente_id: consulta.paciente_id,
        medicamento: form.medicamento.trim(),
        dosagem: form.dosagem.trim(),
        posologia: form.posologia.trim(),
        observacoes: form.observacoes.trim() || undefined,
        validade: form.validade,
      });
      setForm(emptyForm());
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

  const idPfx = consulta.id;

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

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
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
              Paciente: {nome}
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
            Receita lançada
          </div>
        ) : (
          <>
            {/* Linha 1: Medicamento + Dosagem */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <Field label="Medicamento" id={`med-${idPfx}`} required>
                <input
                  id={`med-${idPfx}`}
                  type="text"
                  value={form.medicamento}
                  onChange={(e) => patch("medicamento", e.target.value)}
                  disabled={saving}
                  placeholder="Ex.: Sertralina"
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                />
              </Field>
              <Field label="Dosagem" id={`dos-${idPfx}`} required>
                <input
                  id={`dos-${idPfx}`}
                  type="text"
                  value={form.dosagem}
                  onChange={(e) => patch("dosagem", e.target.value)}
                  disabled={saving}
                  placeholder="Ex.: 50 mg"
                  style={{ ...inputStyle, width: 100 }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
                />
              </Field>
            </div>

            {/* Posologia */}
            <Field label="Posologia" id={`pos-${idPfx}`} required>
              <input
                id={`pos-${idPfx}`}
                type="text"
                value={form.posologia}
                onChange={(e) => patch("posologia", e.target.value)}
                disabled={saving}
                placeholder="Ex.: 1 comprimido pela manhã por 30 dias"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
              />
            </Field>

            {/* Validade */}
            <Field label="Válida até" id={`val-${idPfx}`} required>
              <input
                id={`val-${idPfx}`}
                type="date"
                value={form.validade}
                onChange={(e) => patch("validade", e.target.value)}
                disabled={saving}
                style={{ ...inputStyle, width: "fit-content" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
              />
            </Field>

            {/* Observações (opcional) */}
            <Field label="Observações (opcional)" id={`obs-${idPfx}`}>
              <textarea
                id={`obs-${idPfx}`}
                value={form.observacoes}
                onChange={(e) => patch("observacoes", e.target.value)}
                disabled={saving}
                rows={3}
                placeholder="Instruções adicionais, contraindicações, retorno…"
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: 64,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.teal500; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.gray200; }}
              />
            </Field>

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
      <div style={{ height: 32, borderRadius: 10, background: T.gray100 }} />
      <div style={{ height: 32, borderRadius: 10, background: T.gray100 }} />
      <div style={{ height: 32, borderRadius: 10, background: T.gray100 }} />
    </div>
  );
}

/* ── main export ──────────────────────────────────────────── */

export default function MinhasReceitas(): JSX.Element {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
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
      const realizadas = agenda.filter((c) => c.status === "realizada");
      setConsultas(realizadas);
      setComReceita(
        new Set(
          receitas
            .map((r) => r.consulta_id)
            .filter((id): id is string => !!id),
        ),
      );
      // nomes dos pacientes num único request (RLS 0003 liberou a leitura)
      const ids = Array.from(new Set(realizadas.map((c) => c.paciente_id)));
      if (ids.length > 0) {
        try {
          setNomes(await getNomesPacientes(ids));
        } catch {
          // fallback "Paciente #id"
        }
      } else {
        setNomes({});
      }
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
              nome={nomeDoPaciente(c, nomes)}
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
