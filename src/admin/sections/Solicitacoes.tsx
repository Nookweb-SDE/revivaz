import React, { useEffect, useState } from "react";
import {
  adminListTodasConsultas,
  adminConfirmarConsulta,
  adminMarcarRealizada,
  adminCancelarConsulta,
  adminLancarReceita,
  listProfissionais,
  getNomesPacientes,
} from "../../lib/data";
import type { Consulta, Profissional, StatusConsulta } from "../../lib/types";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: T.gray600,
  marginBottom: 4,
  fontFamily: "'Nunito',sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1.5px solid ${T.gray200}`,
  fontSize: 14,
  fontFamily: "'Nunito',sans-serif",
  color: T.gray950,
  boxSizing: "border-box",
  outline: "2px solid transparent", // foco visível vem da regra :focus-visible global
};

const badgeStyle = (status: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; color: string }> = {
    solicitada: { bg: "#FEF3C7", color: "#92400E" },
    agendada: { bg: T.teal100, color: T.teal900 },
    realizada: { bg: "#D1FAE5", color: "#065F46" },
    cancelada: { bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = colors[status] ?? { bg: T.gray100, color: T.gray700 };
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    background: c.bg,
    color: c.color,
    fontFamily: "'Nunito',sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
};

// Filtro de status — null = todas
type FiltroStatus = StatusConsulta | null;

const FILTROS: { key: FiltroStatus; label: string }[] = [
  { key: null, label: "Todas" },
  { key: "solicitada", label: "Solicitadas" },
  { key: "agendada", label: "Agendadas" },
  { key: "realizada", label: "Realizadas" },
  { key: "cancelada", label: "Canceladas" },
];

function chipStyle(ativo: boolean): React.CSSProperties {
  return {
    padding: "7px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Nunito',sans-serif",
    border: `1.5px solid ${ativo ? T.teal700 : T.gray200}`,
    background: ativo ? T.teal700 : T.white,
    color: ativo ? T.white : T.gray700,
    minHeight: 36,
  };
}

// ---------------------------------------------------------------------------
// Confirmar Form
// ---------------------------------------------------------------------------

function ConfirmarForm({
  consulta,
  profissionais,
  onDone,
}: {
  consulta: Consulta;
  profissionais: Profissional[];
  onDone: () => void;
}) {
  const uid = React.useId();
  const [profissionalId, setProfissionalId] = useState(
    consulta.profissional_id ?? profissionais[0]?.id ?? ""
  );
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profissionalId || !data || !hora) {
      setErro("Preencha profissional, data e hora.");
      return;
    }
    setLoading(true);
    setErro(null);
    setAviso(null);
    try {
      await adminConfirmarConsulta(consulta.id, {
        profissional_id: profissionalId,
        data,
        hora,
        link_ou_local: link || undefined,
      });

      // Não há mais aviso automático: o canal de WhatsApp saiu do produto. A
      // consulta agendada aparece no /conta do paciente.

      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao confirmar.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 12,
        padding: 14,
        background: T.teal050,
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <label style={label} htmlFor={`${uid}-prof`}>Profissional</label>
        <select
          id={`${uid}-prof`}
          value={profissionalId}
          onChange={(e) => setProfissionalId(e.target.value)}
          style={inputStyle}
          required
        >
          <option value="">Selecione…</option>
          {profissionais.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
              {p.especialidade ? ` — ${p.especialidade}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={label} htmlFor={`${uid}-data`}>Data</label>
          <input
            id={`${uid}-data`}
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={label} htmlFor={`${uid}-hora`}>Hora</label>
          <input
            id={`${uid}-hora`}
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
      </div>
      <div>
        <label style={label} htmlFor={`${uid}-link`}>Link / Local (opcional)</label>
        <input
          id={`${uid}-link`}
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://meet.google.com/… ou endereço"
          style={inputStyle}
        />
      </div>
      {erro && (
        <p style={{ color: T.red, fontSize: 12, margin: 0 }}>{erro}</p>
      )}
      {aviso && (
        <p style={{ color: T.gray600, fontSize: 12, margin: 0 }}>{aviso}</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {aviso ? (
          <button
            type="button"
            style={{ ...btnPrimary, padding: "10px 18px" }}
            onClick={onDone}
          >
            Concluir
          </button>
        ) : (
          <button type="submit" style={{ ...btnPrimary, padding: "10px 18px" }} disabled={loading}>
            {loading ? "Salvando…" : "Confirmar consulta"}
          </button>
        )}
        <button
          type="button"
          style={{ ...btnGhost, alignSelf: "center" }}
          onClick={onDone}
        >
          {aviso ? "Fechar" : "Cancelar"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Lançar Receita Form
// ---------------------------------------------------------------------------

function ReceitaForm({
  consulta,
  onDone,
}: {
  consulta: Consulta;
  onDone: () => void;
}) {
  const uid = React.useId();
  const [resumo, setResumo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumo.trim()) {
      setErro("Informe o resumo da receita.");
      return;
    }
    if (!consulta.profissional_id) {
      setErro("Consulta sem profissional associado.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await adminLancarReceita({
        consulta_id: consulta.id,
        paciente_id: consulta.paciente_id,
        profissional_id: consulta.profissional_id,
        resumo,
      });
      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao lançar receita.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 12,
        padding: 14,
        background: "#F0FDF4",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <label style={label} htmlFor={`${uid}-resumo`}>Resumo da receita / orientações</label>
        <textarea
          id={`${uid}-resumo`}
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          rows={4}
          placeholder="Descreva as orientações, medicamentos ou encaminhamentos…"
          style={{ ...inputStyle, resize: "vertical" }}
          required
        />
      </div>
      {erro && (
        <p style={{ color: T.red, fontSize: 12, margin: 0 }}>{erro}</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" style={{ ...btnPrimary, padding: "10px 18px", background: T.green500 }} disabled={loading}>
          {loading ? "Salvando…" : "Lançar receita"}
        </button>
        <button type="button" style={{ ...btnGhost, alignSelf: "center" }} onClick={onDone}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Consulta Card
// ---------------------------------------------------------------------------

function ConsultaCard({
  consulta,
  profissionais,
  nomePaciente,
  onRefresh,
}: {
  consulta: Consulta;
  profissionais: Profissional[];
  nomePaciente?: string;
  onRefresh: () => void;
}) {
  const [openForm, setOpenForm] = useState<"confirmar" | "receita" | null>(null);
  const [acaoLoading, setAcaoLoading] = useState<"realizar" | "cancelar" | null>(
    null
  );
  const [erro, setErro] = useState<string | null>(null);

  const profissional = profissionais.find(
    (p) => p.id === consulta.profissional_id
  );

  async function marcarRealizada() {
    setAcaoLoading("realizar");
    setErro(null);
    try {
      await adminMarcarRealizada(consulta.id);
      onRefresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro.");
    } finally {
      setAcaoLoading(null);
    }
  }

  async function cancelar() {
    if (
      !window.confirm(
        "Cancelar esta consulta? O paciente perderá o agendamento."
      )
    )
      return;
    setAcaoLoading("cancelar");
    setErro(null);
    try {
      await adminCancelarConsulta(consulta.id);
      onRefresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao cancelar.");
    } finally {
      setAcaoLoading(null);
    }
  }

  const cancelavel =
    consulta.status === "solicitada" || consulta.status === "agendada";

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <span style={badgeStyle(consulta.status)}>{consulta.status}</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: T.gray600,
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            {consulta.tipo === "online" ? "Online" : "Presencial"}
          </span>
        </div>
        <span style={{ fontSize: 11, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
          {new Date(consulta.created_at).toLocaleDateString("pt-BR")}
        </span>
      </div>

      {/* Details */}
      <div style={{ marginTop: 10, fontSize: 13, color: T.gray700, fontFamily: "'Nunito',sans-serif", lineHeight: 1.6 }}>
        <div>
          <strong>Paciente:</strong>{" "}
          {nomePaciente && nomePaciente.trim() ? (
            nomePaciente
          ) : (
            <code style={{ background: T.gray100, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>
              {consulta.paciente_id.slice(0, 8)}…
            </code>
          )}
        </div>
        {profissional && (
          <div>
            <strong>Profissional:</strong> {profissional.nome}
            {profissional.especialidade ? ` — ${profissional.especialidade}` : ""}
          </div>
        )}
        {consulta.data && (
          <div>
            <strong>Data/Hora:</strong>{" "}
            {new Date(`${consulta.data}T${consulta.hora ?? "00:00"}`).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
        )}
        {consulta.link_ou_local && (
          <div>
            <strong>Link/Local:</strong> {consulta.link_ou_local}
          </div>
        )}
        {consulta.obs && (
          <div>
            <strong>Observação do paciente:</strong> {consulta.obs}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {consulta.status === "solicitada" && openForm !== "confirmar" && (
          <button
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13 }}
            onClick={() => setOpenForm("confirmar")}
          >
            Confirmar
          </button>
        )}
        {consulta.status === "agendada" && openForm !== "receita" && (
          <>
            <button
              style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, background: T.teal500 }}
              onClick={marcarRealizada}
              disabled={acaoLoading === "realizar"}
            >
              {acaoLoading === "realizar" ? "Salvando…" : "Marcar realizada"}
            </button>
            <button
              style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, background: T.green500 }}
              onClick={() => setOpenForm("receita")}
            >
              Lançar receita
            </button>
          </>
        )}
        {consulta.status === "realizada" && openForm !== "receita" && (
          <button
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, background: T.green500 }}
            onClick={() => setOpenForm("receita")}
          >
            Lançar receita
          </button>
        )}
        {cancelavel && (
          <button
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 12,
              border: `1.5px solid ${T.red}`,
              background: T.white,
              color: T.red,
              cursor: "pointer",
              fontFamily: "'Nunito',sans-serif",
              minHeight: 36,
            }}
            onClick={cancelar}
            disabled={acaoLoading === "cancelar"}
          >
            {acaoLoading === "cancelar" ? "Cancelando…" : "Cancelar"}
          </button>
        )}
      </div>

      {erro && (
        <p style={{ color: T.red, fontSize: 12, margin: "8px 0 0" }}>{erro}</p>
      )}

      {openForm === "confirmar" && (
        <ConfirmarForm
          consulta={consulta}
          profissionais={profissionais}
          onDone={() => {
            setOpenForm(null);
            onRefresh();
          }}
        />
      )}
      {openForm === "receita" && (
        <ReceitaForm
          consulta={consulta}
          onDone={() => {
            setOpenForm(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solicitacoes Section
// ---------------------------------------------------------------------------

export function Solicitacoes() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [nomesPacientes, setNomesPacientes] = useState<Record<string, string>>(
    {}
  );
  const [filtro, setFiltro] = useState<FiltroStatus>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function load(statusFiltro: FiltroStatus) {
    setLoading(true);
    setErro(null);
    try {
      const [c, p] = await Promise.all([
        adminListTodasConsultas(statusFiltro ? { status: statusFiltro } : undefined),
        // inclui inativos p/ resolver o nome de profissionais desativados
        listProfissionais(),
      ]);
      setConsultas(c);
      setProfissionais(p);

      // nomes dos pacientes envolvidos (RLS admin libera)
      const ids = Array.from(new Set(c.map((x) => x.paciente_id)));
      const nomes = await getNomesPacientes(ids);
      setNomesPacientes(nomes);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ ...sectionTitle, margin: 0, fontSize: 18 }}>
          Consultas{!loading ? ` (${consultas.length})` : ""}
        </h2>
        <button style={{ ...btnGhost, fontSize: 13 }} onClick={() => load(filtro)}>
          Atualizar
        </button>
      </div>

      {/* Chips de filtro por status */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {FILTROS.map((f) => (
          <button
            key={f.label}
            style={chipStyle(filtro === f.key)}
            onClick={() => setFiltro(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
          Carregando consultas…
        </div>
      ) : erro ? (
        <div style={{ color: T.red, padding: 20, fontFamily: "'Nunito',sans-serif" }}>
          {erro}{" "}
          <button style={btnGhost} onClick={() => load(filtro)}>
            Tentar novamente
          </button>
        </div>
      ) : consultas.length === 0 ? (
        <div
          style={{
            ...card,
            textAlign: "center",
            padding: 40,
            color: T.gray600,
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          {filtro
            ? `Nenhuma consulta com status "${filtro}".`
            : "Nenhuma consulta registrada."}
        </div>
      ) : (
        consultas.map((c) => (
          <ConsultaCard
            key={c.id}
            consulta={c}
            profissionais={profissionais}
            nomePaciente={nomesPacientes[c.paciente_id]}
            onRefresh={() => load(filtro)}
          />
        ))
      )}
    </div>
  );
}
