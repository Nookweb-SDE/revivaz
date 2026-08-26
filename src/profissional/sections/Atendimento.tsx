/**
 * Aba Atendimento do profissional.
 *
 * Este arquivo tinha 1232 linhas e concentrava quatro coisas. Agora é só a
 * orquestração: carrega os dados, guarda o estado e compõe as partes.
 *   _lib/atendimentoUtils.ts     → helpers puros e tokens (com teste)
 *   HistoricoModal.tsx            → histórico do paciente
 *   EmitirReceitaModal.tsx        → emissão de receita
 *   AtendimentoConsultaCard.tsx   → o cartão de cada consulta
 */
import React, { useEffect, useState, useCallback } from "react";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import {
  profMinhaAgenda,
  profMarcarRealizada,
  profSalvarObsClinica,
  profHistoricoPaciente,
  profMinhaFicha,
  profLancarReceita,
  getNomesPacientes,
  getRoomToken,
  profListAvaliacoes,
} from "../../lib/data";
import type { Consulta, Profissional, Receita, Avaliacao } from "../../lib/types";
import { T, card, sectionTitle, btnPrimary, btnGhost } from "../../conta/ui";
import { isOnline } from "../../video/room";
import { jitsiConfigured } from "../../video/config";
import SalaVideo from "../../video/SalaVideo";
import TriagemRecente from "./TriagemRecente";
import NotaClinicaIA from "./NotaClinicaIA";

import HistoricoModal from "./HistoricoModal";
import EmitirReceitaModal from "./EmitirReceitaModal";
import ConsultaCard from "./AtendimentoConsultaCard";
import { nomeDoPaciente } from "./_lib/atendimentoUtils";

export default function Atendimento() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [nomes, setNomes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<{ pacienteId: string; nome: string } | null>(null);
  // modal emitir receita
  const [emitirReceita, setEmitirReceita] = useState<{ consulta: Consulta; nome: string } | null>(null);
  // avaliações indexadas por consulta_id
  const [avaliacoesMap, setAvaliacoesMap] = useState<Record<string, Avaliacao>>({});
  // Atendimento virtual (sala in-app)
  const [ficha, setFicha] = useState<Profissional | null>(null);
  const [entrandoId, setEntrandoId] = useState<string | null>(null);
  const [sala, setSala] = useState<{ domain: string; room: string; token: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const c = await profMinhaAgenda();
      setConsultas(c);
      // Ficha p/ usar o nome do profissional como displayName na sala (best-effort).
      void profMinhaFicha()
        .then((f) => setFicha(f))
        .catch(() => {
          /* sem ficha: cai no fallback "Profissional" */
        });
      const ids = Array.from(new Set(c.map((x) => x.paciente_id)));
      if (ids.length > 0) {
        try {
          setNomes(await getNomesPacientes(ids));
        } catch {
          // fallback "Paciente #id"
        }
      } else {
        setNomes({});
      }
      // Avaliações das consultas (best-effort — não bloqueia a UI se falhar)
      try {
        const avals = await profListAvaliacoes();
        const map: Record<string, Avaliacao> = {};
        for (const a of avals) {
          if (a.consulta_id) map[a.consulta_id] = a;
        }
        setAvaliacoesMap(map);
      } catch {
        // mantém mapa anterior
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar a agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRealizada(id: string, obs: string) {
    await profMarcarRealizada(id);
    // grava anotação clínica se o profissional escreveu algo
    if (obs.trim().length > 0) {
      await profSalvarObsClinica(id, obs.trim());
    }
    await load();
  }

  function handleHistorico(pacienteId: string, nome: string) {
    setHistorico({ pacienteId, nome });
  }

  function handleEmitirReceita(consulta: Consulta, nome: string) {
    setEmitirReceita({ consulta, nome });
  }

  const handleEntrar = useCallback(async (c: Consulta) => {
    // Degrade com elegância: sem Jitsi configurado, abre o link externo (comportamento atual).
    if (!jitsiConfigured) {
      if (c.link_ou_local) {
        window.open(c.link_ou_local, "_blank", "noopener,noreferrer");
      } else {
        setErro("Sala de vídeo indisponível: nenhum link foi definido para esta consulta.");
      }
      return;
    }
    setEntrandoId(c.id);
    setErro(null);
    try {
      const { token, room, domain } = await getRoomToken(c.id);
      setSala({ token, room, domain });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar na sala.");
    } finally {
      setEntrandoId(null);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
        Carregando atendimentos…
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ color: T.red, padding: 20, fontFamily: "'Nunito',sans-serif" }}>
        {erro}{" "}
        <button style={btnGhost} onClick={() => void load()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  const agendadas = consultas.filter((c) => c.status === "agendada");
  const realizadas = consultas.filter((c) => c.status === "realizada").slice(0, 10);

  return (
    <div>
      {/* A realizar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ ...sectionTitle, margin: 0, fontSize: 18 }}>A realizar ({agendadas.length})</h2>
        <button style={{ ...btnGhost, fontSize: 13 }} onClick={() => void load()}>
          Atualizar
        </button>
      </div>

      {agendadas.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 40, color: T.gray600, fontFamily: "'Nunito',sans-serif" }}>
          Nenhuma consulta agendada no momento.
        </div>
      ) : (
        agendadas.map((c) => (
          <ConsultaCard
            key={c.id}
            consulta={c}
            nome={nomeDoPaciente(c, nomes)}
            onRealizada={handleRealizada}
            onHistorico={handleHistorico}
            onEmitirReceita={handleEmitirReceita}
            onEntrar={handleEntrar}
            entrando={entrandoId === c.id}
          />
        ))
      )}

      {/* Realizadas recentes (anotação editável) */}
      {realizadas.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ ...sectionTitle, margin: "0 0 16px", fontSize: 18 }}>Realizadas recentes</h2>
          {realizadas.map((c) => (
            <ConsultaCard
              key={c.id}
              consulta={c}
              nome={nomeDoPaciente(c, nomes)}
              onRealizada={handleRealizada}
              onHistorico={handleHistorico}
              onEmitirReceita={handleEmitirReceita}
              readonly
              avaliacao={avaliacoesMap[c.id] ?? null}
            />
          ))}
        </div>
      )}

      {historico && (
        <HistoricoModal
          pacienteId={historico.pacienteId}
          pacienteNome={historico.nome}
          onFechar={() => setHistorico(null)}
        />
      )}

      {emitirReceita && (
        <EmitirReceitaModal
          consulta={emitirReceita.consulta}
          pacienteNome={emitirReceita.nome}
          onFechar={() => setEmitirReceita(null)}
          onEmitida={() => {
            // Mantém o modal aberto mostrando confirmação; o load() re-sincroniza
            // o histórico do paciente se ele for aberto depois.
            void load();
          }}
        />
      )}

      {sala && (
        <SalaVideo
          domain={sala.domain}
          room={sala.room}
          token={sala.token}
          displayName={ficha?.nome?.trim() || "Profissional"}
          onSair={() => setSala(null)}
        />
      )}
    </div>
  );
}
