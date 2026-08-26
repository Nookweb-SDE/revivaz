import React, { useEffect, useState } from "react";
import { Inbox, Phone, Mail, Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import { adminListLeads, adminAtualizarLead } from "../../lib/data";
import type { Lead } from "../../lib/types";
import { T, card, sectionTitle, btnGhost } from "../../conta/ui";

// Pedidos que chegam pelo formulário da landing (POST /api/lead).
// Sem esta tela os pedidos ficariam no banco sem ninguém ver — que é o mesmo
// resultado prático do formulário decorativo que existia antes.

const STATUS: Array<{ v: Lead["status"]; label: string; cor: string; fundo: string }> = [
  { v: "novo", label: "Novo", cor: "#92400E", fundo: "#FEF3C7" },
  { v: "contatado", label: "Contatado", cor: "#1E40AF", fundo: "#DBEAFE" },
  { v: "convertido", label: "Convertido", cor: "#065F46", fundo: "#D1FAE5" },
  { v: "descartado", label: "Descartado", cor: "#6B7280", fundo: "#F3F4F6" },
];

function fmtQuando(l: Lead): string {
  if (!l.data_desejada) return "sem preferência de data";
  const [y, m, d] = l.data_desejada.split("-");
  const hora = l.hora_desejada ? ` às ${l.hora_desejada.slice(0, 5)}` : "";
  return `${d}/${m}/${y}${hora}`;
}

function fmtRecebido(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

/** Só dígitos, com 55 na frente — formato que o wa.me espera. */
function linkWhatsapp(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  return `https://wa.me/${d.startsWith("55") ? d : `55${d}`}`;
}

function LeadCard({
  lead,
  onMudarStatus,
}: {
  lead: Lead;
  onMudarStatus: (id: string, status: Lead["status"]) => void;
}): JSX.Element {
  const badge = STATUS.find((s) => s.v === lead.status) ?? STATUS[0];
  return (
    <article style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, color: T.gray950 }}>
            {lead.nome}
          </div>
          <div style={{ fontSize: 12, color: T.gray600, marginTop: 2 }}>
            recebido em {fmtRecebido(lead.created_at)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Dois funis chegam por aqui: quem quer consulta e quem quer ATENDER. */}
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Nunito',sans-serif",
              background: lead.origem === "profissional" ? "#EDE9FE" : T.teal050,
              color: lead.origem === "profissional" ? "#5B21B6" : T.teal700,
            }}
          >
            {lead.origem === "profissional" ? "Quer atender" : "Quer consulta"}
          </span>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Nunito',sans-serif",
              background: badge.fundo,
              color: badge.cor,
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 13, color: T.gray600 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Phone size={13} aria-hidden="true" /> {lead.telefone}
        </span>
        {lead.email && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Mail size={13} aria-hidden="true" /> {lead.email}
          </span>
        )}
        {lead.origem !== "profissional" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Calendar size={13} aria-hidden="true" /> {fmtQuando(lead)}
          </span>
        )}
        {lead.especialidade && <span>{lead.especialidade}</span>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <a
          href={linkWhatsapp(lead.telefone)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...btnGhost,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#1DA851",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            minHeight: 36,
            textDecoration: "none",
          }}
        >
          <Phone size={13} aria-hidden="true" /> Chamar no WhatsApp
        </a>

        <label htmlFor={`status-${lead.id}`} style={{ fontSize: 12, color: T.gray600, fontWeight: 700 }}>
          Situação
        </label>
        <select
          id={`status-${lead.id}`}
          value={lead.status}
          onChange={(e) => onMudarStatus(lead.id, e.target.value as Lead["status"])}
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontSize: 12,
            fontWeight: 700,
            padding: "8px 10px",
            borderRadius: 10,
            border: `1.5px solid ${T.gray200}`,
            background: T.white,
            color: T.gray950,
            minHeight: 36,
          }}
        >
          {STATUS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

export default function PedidosSite(): JSX.Element {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      setLeads(await adminListLeads());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui carregar os pedidos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function mudarStatus(id: string, status: Lead["status"]) {
    const antes = leads;
    setLeads((atual) => atual.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await adminAtualizarLead(id, { status });
    } catch (err) {
      setLeads(antes); // desfaz: a tela não pode mostrar o que o banco recusou
      setErro(err instanceof Error ? err.message : "Não consegui salvar a mudança.");
    }
  }

  const novos = leads.filter((l) => l.status === "novo").length;

  return (
    <section aria-label="Pedidos vindos do site">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={sectionTitle}>
          Pedidos do site{novos > 0 ? ` (${novos} novo${novos > 1 ? "s" : ""})` : ""}
        </h2>
        <button
          onClick={() => void carregar()}
          disabled={carregando}
          style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, minHeight: 36 }}
        >
          <RefreshCw size={13} aria-hidden="true" /> Atualizar
        </button>
      </div>

      {erro && (
        <div role="alert" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "#FEE2E2", color: "#991B1B", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
          <AlertTriangle size={15} aria-hidden="true" /> {erro}
        </div>
      )}

      {carregando ? (
        <p style={{ color: T.gray600, fontSize: 14 }}>Carregando…</p>
      ) : leads.length === 0 ? (
        <div role="status" style={{ ...card, padding: 28, textAlign: "center", color: T.gray600 }}>
          <Inbox size={26} aria-hidden="true" style={{ marginBottom: 8, opacity: 0.6 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Nenhum pedido pelo site ainda.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leads.map((l) => (
            <LeadCard key={l.id} lead={l} onMudarStatus={mudarStatus} />
          ))}
        </div>
      )}
    </section>
  );
}
