import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CalendarPlus,
  Check,
  Link2,
  AlertCircle,
} from "lucide-react";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";
import { profMinhaAgenda, profDefinirAgenda, profMarcarRealizada } from "../../lib/data";
import type { Consulta } from "../../lib/types";

/* ─── helpers ─── */
function shortId(id: string): string {
  return id.slice(0, 8);
}

function formatData(iso: string | null): string {
  if (!iso) return "Sem data";
  const parts = iso.split("-").map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return iso;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

/* ─── spinner (padrão das áreas protegidas) ─── */
function Spinner(): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ display: "flex", justifyContent: "center", padding: "40px 16px" }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `3px solid ${T.teal100}`,
          borderTopColor: T.teal700,
          animation: "revivaz-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes revivaz-spin{to{transform:rotate(360deg)}}`}</style>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        Carregando agenda…
      </span>
    </div>
  );
}

/* ─── badges ─── */
const badgeBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "2px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  fontFamily: "'Nunito',sans-serif",
};

function tipoBadge(tipo: Consulta["tipo"]): JSX.Element {
  const online = tipo === "online";
  return (
    <span
      style={{
        ...badgeBase,
        background: online ? T.teal100 : T.gray100,
        color: online ? T.teal700 : T.gray600,
      }}
    >
      {online ? (
        <Video size={11} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <MapPin size={11} strokeWidth={2.5} aria-hidden="true" />
      )}
      {online ? "Online" : "Presencial"}
    </span>
  );
}

/* ─── avatar (id curto, paciente anônimo via RLS) ─── */
function PacienteAvatar(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${T.teal500} 0%, ${T.teal700} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.white,
        fontFamily: "'Nunito',sans-serif",
        fontWeight: 800,
        fontSize: 16,
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      P
    </div>
  );
}

/* ─── form de agendamento ─── */
function AgendarForm({
  consulta,
  onConfirmar,
  onCancelar,
  busy,
}: {
  consulta: Consulta;
  onConfirmar: (dados: { data: string; hora: string; link_ou_local?: string }) => void;
  onCancelar: () => void;
  busy: boolean;
}): JSX.Element {
  const [data, setData] = useState(consulta.data ?? "");
  const [hora, setHora] = useState(consulta.hora ?? "");
  const [link, setLink] = useState(consulta.link_ou_local ?? "");

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${T.gray200}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "'Nunito',sans-serif",
    color: T.gray950,
    background: T.white,
    minHeight: 44,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "'Nunito',sans-serif",
    fontWeight: 700,
    fontSize: 12,
    color: T.gray700,
    marginBottom: 4,
  };

  const podeConfirmar = data.trim() !== "" && hora.trim() !== "" && !busy;
  const linkLabel = consulta.tipo === "online" ? "Link da teleconsulta" : "Local do atendimento";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!podeConfirmar) return;
        onConfirmar({
          data: data.trim(),
          hora: hora.trim(),
          link_ou_local: link.trim() || undefined,
        });
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 130px", minWidth: 0 }}>
          <label style={labelStyle} htmlFor={`data-${consulta.id}`}>
            Data
          </label>
          <input
            id={`data-${consulta.id}`}
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div style={{ flex: "1 1 110px", minWidth: 0 }}>
          <label style={labelStyle} htmlFor={`hora-${consulta.id}`}>
            Hora
          </label>
          <input
            id={`hora-${consulta.id}`}
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            style={inputStyle}
            required
          />
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor={`link-${consulta.id}`}>
          {linkLabel} <span style={{ fontWeight: 500, color: T.gray600 }}>(opcional)</span>
        </label>
        <input
          id={`link-${consulta.id}`}
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder={consulta.tipo === "online" ? "https://meet…" : "Endereço / sala"}
          style={inputStyle}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onCancelar}
          disabled={busy}
          style={{
            ...btnGhost,
            border: `1px solid ${T.gray200}`,
            borderRadius: 10,
            padding: "9px 16px",
            fontSize: 13,
            minHeight: 40,
            color: T.gray700,
            opacity: busy ? 0.6 : 1,
            cursor: busy ? "default" : "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!podeConfirmar}
          style={{
            ...btnPrimary,
            padding: "9px 18px",
            fontSize: 13,
            minHeight: 40,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            opacity: podeConfirmar ? 1 : 0.55,
            cursor: podeConfirmar ? "pointer" : "default",
          }}
        >
          <Check size={15} strokeWidth={2.5} aria-hidden="true" />
          {busy ? "Salvando…" : "Confirmar agenda"}
        </button>
      </div>
    </form>
  );
}

/* ─── linha de consulta ─── */
function ConsultaRow({
  c,
  onDefinir,
  onRealizada,
  busyId,
}: {
  c: Consulta;
  onDefinir: (id: string, dados: { data: string; hora: string; link_ou_local?: string }) => void;
  onRealizada: (id: string) => void;
  busyId: string | null;
}): JSX.Element {
  const [aberto, setAberto] = useState(false);
  const busy = busyId === c.id;
  const pendente = c.status === "solicitada";

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12, padding: "14px 16px" }}>
      {/* topo: avatar + info + tipo */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <PacienteAvatar />
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
            Paciente
          </div>
          <div
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 11,
              color: T.gray600,
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
            title={c.paciente_id}
          >
            #{shortId(c.paciente_id)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "'Nunito',sans-serif",
                fontSize: 12,
                color: T.gray600,
              }}
            >
              <Calendar size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
              {formatData(c.data)}
            </span>
            {c.hora && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 12,
                  color: T.gray600,
                }}
              >
                <Clock size={13} color={T.teal500} strokeWidth={2.5} aria-hidden="true" />
                {c.hora}
              </span>
            )}
          </div>
        </div>
        {tipoBadge(c.tipo)}
      </div>

      {/* obs */}
      {c.obs && (
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray700,
            lineHeight: 1.5,
            background: T.gray050,
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          {c.obs}
        </p>
      )}

      {/* link/local (quando agendada) */}
      {!pendente && c.link_ou_local && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 12,
            color: T.teal700,
            wordBreak: "break-all",
          }}
        >
          <Link2 size={13} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0 }} />
          {c.link_ou_local}
        </div>
      )}

      {/* ações */}
      {pendente ? (
        aberto ? (
          <AgendarForm
            consulta={c}
            busy={busy}
            onCancelar={() => setAberto(false)}
            onConfirmar={(dados) => onDefinir(c.id, dados)}
          />
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setAberto(true)}
              style={{
                ...btnPrimary,
                padding: "8px 16px",
                fontSize: 13,
                minHeight: 38,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
              aria-label={`Agendar consulta do paciente ${shortId(c.paciente_id)}`}
            >
              <CalendarPlus size={15} strokeWidth={2.5} aria-hidden="true" />
              Agendar
            </button>
          </div>
        )
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => onRealizada(c.id)}
            disabled={busy}
            style={{
              ...btnGhost,
              border: `1px solid ${T.teal700}`,
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              minHeight: 38,
              color: T.teal700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              opacity: busy ? 0.6 : 1,
              cursor: busy ? "default" : "pointer",
            }}
            aria-label={`Marcar consulta do paciente ${shortId(c.paciente_id)} como realizada`}
          >
            <Check size={15} strokeWidth={2.5} aria-hidden="true" />
            {busy ? "Salvando…" : "Marcar realizada"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── grupo (seção com título + contador) ─── */
function Grupo({
  titulo,
  itens,
  onDefinir,
  onRealizada,
  busyId,
  vazio,
}: {
  titulo: string;
  itens: Consulta[];
  onDefinir: (id: string, dados: { data: string; hora: string; link_ou_local?: string }) => void;
  onRealizada: (id: string) => void;
  busyId: string | null;
  vazio: string;
}): JSX.Element {
  return (
    <section aria-label={titulo} style={{ marginBottom: 24 }}>
      <h3 style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 8 }}>
        {titulo}
        <span
          style={{
            background: itens.length > 0 ? T.teal100 : T.gray100,
            color: itens.length > 0 ? T.teal700 : T.gray600,
            borderRadius: 999,
            padding: "0 8px",
            fontSize: 12,
            fontWeight: 700,
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {itens.length}
        </span>
      </h3>
      {itens.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.gray600,
            padding: "12px 4px",
          }}
        >
          {vazio}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {itens.map((c) => (
            <ConsultaRow
              key={c.id}
              c={c}
              onDefinir={onDefinir}
              onRealizada={onRealizada}
              busyId={busyId}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── componente principal ─── */
export default function Agenda(): JSX.Element {
  const [consultas, setConsultas] = useState<Consulta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const lista = await profMinhaAgenda();
      setConsultas(lista);
    } catch (e) {
      setConsultas([]);
      setErro(e instanceof Error ? e.message : "Não foi possível carregar a agenda.");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleDefinir = useCallback(
    async (id: string, dados: { data: string; hora: string; link_ou_local?: string }) => {
      setBusyId(id);
      setErro(null);
      try {
        await profDefinirAgenda(id, dados);
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar a agenda.");
      } finally {
        setBusyId(null);
      }
    },
    [carregar]
  );

  const handleRealizada = useCallback(
    async (id: string) => {
      setBusyId(id);
      setErro(null);
      try {
        await profMarcarRealizada(id);
        await carregar();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível atualizar a consulta.");
      } finally {
        setBusyId(null);
      }
    },
    [carregar]
  );

  if (consultas === null) {
    return <Spinner />;
  }

  if (erro && consultas.length === 0) {
    return (
      <div
        role="alert"
        style={{
          ...card,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          borderColor: T.red,
        }}
      >
        <AlertCircle size={18} color={T.red} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: T.gray950,
            }}
          >
            Não foi possível carregar a agenda
          </p>
          <p style={{ margin: "4px 0 12px", fontFamily: "'Nunito',sans-serif", fontSize: 13, color: T.gray600 }}>
            {erro}
          </p>
          <button
            onClick={() => void carregar()}
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13, minHeight: 38 }}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  const pendentes = consultas.filter((c) => c.status === "solicitada");
  const proximas = consultas.filter((c) => c.status === "agendada");
  const semAgenda = pendentes.length === 0 && proximas.length === 0;

  if (semAgenda) {
    return (
      <div
        role="status"
        style={{
          ...card,
          textAlign: "center",
          padding: "32px 16px",
          color: T.gray600,
          fontFamily: "'Nunito',sans-serif",
          fontSize: 14,
        }}
      >
        Nenhuma consulta na sua agenda ainda.
      </div>
    );
  }

  return (
    <div>
      {erro && (
        <div
          role="alert"
          style={{
            ...card,
            marginBottom: 16,
            borderColor: T.red,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Nunito',sans-serif",
            fontSize: 13,
            color: T.red,
          }}
        >
          <AlertCircle size={16} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0 }} />
          {erro}
        </div>
      )}

      <Grupo
        titulo="Pedidos pendentes"
        itens={pendentes}
        onDefinir={handleDefinir}
        onRealizada={handleRealizada}
        busyId={busyId}
        vazio="Nenhum pedido aguardando agendamento."
      />

      <Grupo
        titulo="Próximas"
        itens={proximas}
        onDefinir={handleDefinir}
        onRealizada={handleRealizada}
        busyId={busyId}
        vazio="Nenhuma consulta agendada no momento."
      />
    </div>
  );
}
