import React, { useEffect, useRef, useState } from "react";
import { T, card, btnPrimary } from "../ui";
import { supabase } from "../../lib/supabase";
import {
  listConversas,
  criarConversa,
  getMensagens,
  salvarMensagem,
} from "../../lib/data";

type Msg = { papel: "user" | "assistant"; conteudo: string };

type CrisisResource = { nome: string; contato: string; descricao: string };

/**
 * Persisted AI chat for the logged-in patient.
 *
 * - Opens onto the most recent conversa (listConversas) or lazily creates one
 *   on the first message (criarConversa).
 * - Loads history via getMensagens.
 * - On send: salvarMensagem(user) → POST /api/acolhimento (streaming, same
 *   endpoint as /acolhimento) → salvarMensagem(assistant) with the final text.
 * - Crisis bar (188/192) stays visible; crisis detection is handled server-side
 *   (same contract as AcolhimentoChat) — we just render the returned resources.
 *
 * In demo mode there is no backend, so the parent passes `demo` and we render an
 * informative notice instead of a live chat.
 */
export default function ChatIA({
  onFechar,
  demo = false,
}: {
  onFechar: () => void;
  demo?: boolean;
}): JSX.Element {
  const [loading, setLoading] = useState(!demo);
  const [erro, setErro] = useState<string | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState<CrisisResource[] | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load most recent conversation + its messages on mount (real mode only)
  useEffect(() => {
    if (demo) return;
    let mounted = true;

    async function load() {
      try {
        const conversas = await listConversas();
        if (!mounted) return;
        if (conversas.length > 0) {
          const recente = conversas[0]; // listConversas ordena por updated_at desc
          setConversaId(recente.id);
          const msgs = await getMensagens(recente.id);
          if (!mounted) return;
          setMessages(
            msgs.map((m) => ({ papel: m.papel, conteudo: m.conteudo }))
          );
        }
      } catch (err) {
        if (mounted) {
          setErro(
            err instanceof Error ? err.message : "Erro ao carregar a conversa."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [demo]);

  // Auto-scroll to the bottom as messages stream in
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy || demo) return;
    setCrisis(null);
    setBusy(true);

    // Optimistically render the user's message
    const baseUser: Msg = { papel: "user", conteudo: text };
    const afterUser: Msg[] = [...messages, baseUser];
    setMessages(afterUser);
    setInput("");

    try {
      // Call the AI endpoint (same contract as AcolhimentoChat).
      // We DON'T persist anything yet: crisis / rate-limit / error paths must
      // not leave an orphan user message (nor create an empty conversa) in the
      // history. Only filter out empty assistant turns from the context.
      // O endpoint passou a exigir login (o chat aberto ao público saiu do ar),
      // então vai o Bearer da sessão junto.
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const resp = await fetch("/api/acolhimento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: afterUser
            .filter((m) => m.conteudo.trim())
            .map((m) => ({
              role: m.papel,
              content: m.conteudo,
            })),
        }),
      });

      const data = await resp.json().catch(() => null);
      if (data?.crisis) {
        setCrisis(data.resources);
        return;
      }

      const reply =
        typeof data?.reply === "string" && data.reply.trim() ? data.reply.trim() : "";
      if (!reply) {
        setMessages([
          ...afterUser,
          {
            papel: "assistant",
            conteudo: "Algo deu errado, tente de novo em instantes.",
          },
        ]);
        return;
      }

      // A IA responde via CLI (sem streaming real) — revelamos aos poucos p/
      // manter o efeito de "digitando" no acolhimento.
      const palavras = reply.split(" ");
      let acc = "";
      setMessages([...afterUser, { papel: "assistant", conteudo: "" }]);
      for (let i = 0; i < palavras.length; i++) {
        acc += (i === 0 ? "" : " ") + palavras[i];
        setMessages([...afterUser, { papel: "assistant", conteudo: acc }]);
        if (i % 3 === 2) await new Promise((r) => setTimeout(r, 45));
      }
      acc = reply;
      setMessages([...afterUser, { papel: "assistant", conteudo: acc }]);

      // Persist the complete user+assistant pair only after a successful
      // reply. The conversa is created lazily here too, so rate-limit/error
      // turns never pollute the history (nor create titled-but-empty
      // conversas in ContinuarConversa).
      if (acc.trim()) {
        let cid = conversaId;
        if (!cid) {
          cid = await criarConversa(text.slice(0, 60));
          setConversaId(cid);
        }
        await salvarMensagem(cid, "user", text);
        await salvarMensagem(cid, "assistant", acc);
      }
    } catch (err) {
      setMessages([
        ...afterUser,
        {
          papel: "assistant",
          conteudo: "Algo deu errado, tente de novo em instantes.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Conversa com IA de apoio">
      {/* Header with back button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Voltar"
          style={{
            background: "transparent",
            border: "none",
            color: T.teal700,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          ← Voltar
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 16,
            color: T.gray950,
          }}
        >
          Conversa com IA
        </h2>
      </div>

      {/* Crisis bar (always visible) */}
      <div
        role="complementary"
        aria-label="Números de emergência"
        style={{
          borderTop: `2px solid ${T.teal700}`,
          paddingTop: 8,
          marginBottom: 12,
          fontSize: 12,
          color: T.teal700,
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 600,
        }}
      >
        Em emergência ligue <b>188</b> (CVV, 24h) ou <b>192</b> (SAMU).
      </div>

      <div style={{ ...card, padding: 16 }}>
        {/* Crisis resources (server-detected) */}
        {crisis && (
          <div
            role="alert"
            style={{
              background: "#FDECEC",
              border: `1px solid ${T.red}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 13,
              color: T.gray950,
            }}
          >
            <b>Sua vida importa. Procure ajuda agora:</b>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {crisis.map((r) => (
                <li key={r.nome} style={{ marginBottom: 4 }}>
                  <b>{r.nome}</b> — {r.contato}. {r.descricao}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Demo notice */}
        {demo && (
          <div
            role="status"
            style={{
              background: "#FFF8E1",
              border: "1px solid #F59E0B",
              borderRadius: 12,
              padding: 16,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#92400E",
              textAlign: "center",
            }}
          >
            Chat indisponível no modo demonstração. Configure o backend para
            conversar com a IA de apoio.
          </div>
        )}

        {/* Loading */}
        {!demo && loading && (
          <p
            role="status"
            style={{
              color: T.gray600,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 14,
              textAlign: "center",
              margin: "24px 0",
            }}
          >
            Carregando conversa…
          </p>
        )}

        {/* Load error */}
        {!demo && erro && !loading && (
          <p
            role="alert"
            style={{
              color: T.red,
              fontFamily: "'Nunito',sans-serif",
              fontSize: 14,
              textAlign: "center",
              margin: "24px 0",
            }}
          >
            {erro}
          </p>
        )}

        {/* Chat thread + composer */}
        {!demo && !loading && !erro && (
          <>
            <div
              ref={scrollRef}
              style={{
                minHeight: 240,
                maxHeight: 360,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {messages.length === 0 ? (
                <p
                  style={{
                    color: T.gray600,
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 14,
                    textAlign: "center",
                    margin: "32px 16px",
                    lineHeight: 1.5,
                  }}
                >
                  Este é um espaço de acolhimento. Escreva o que está sentindo —
                  não somos médicos, não damos diagnóstico nem receita.
                </p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: m.papel === "user" ? "right" : "left",
                      margin: "8px 0",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "10px 14px",
                        borderRadius: 14,
                        background: m.papel === "user" ? T.teal700 : T.teal050,
                        color: m.papel === "user" ? T.white : T.gray950,
                        maxWidth: "85%",
                        fontFamily: "'Nunito',sans-serif",
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                        textAlign: "left",
                      }}
                    >
                      {m.conteudo || "…"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Composer */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Escreva o que está sentindo…"
                aria-label="Sua mensagem"
                style={{
                  flex: 1,
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${T.gray200}`,
                  fontFamily: "'Nunito',sans-serif",
                  fontSize: 14,
                  color: T.gray950,
                  outline: "none",
                  background: T.gray050,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = T.teal500;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = T.gray200;
                }}
              />
              <button
                type="button"
                onClick={send}
                disabled={busy}
                style={{
                  ...btnPrimary,
                  padding: "0 18px",
                  opacity: busy ? 0.6 : 1,
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
