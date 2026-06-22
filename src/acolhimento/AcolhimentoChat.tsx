import { useState } from "react";
import type { CrisisResource } from "./crisis";

type Msg = { role: "user" | "assistant"; content: string };

export default function AcolhimentoChat() {
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState<CrisisResource[] | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setBusy(true);
    const resp = await fetch("/api/acolhimento", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const ct = resp.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) {
      const data = await resp.json();
      if (data.crisis) { setCrisis(data.resources); setBusy(false); return; }
      setBusy(false); return;
    }
    const reader = resp.body!.getReader();
    const dec = new TextDecoder();
    let acc = "";
    setMessages([...next, { role: "assistant", content: "" }]);
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      setMessages([...next, { role: "assistant", content: acc }]);
    }
    setBusy(false);
  }

  const teal = "#007A8C";
  if (!consent) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ color: teal }}>Você não está sozinho</h1>
        <p>Este é um espaço de <b>acolhimento</b>. Converso com você, ajudo a se acalmar e te indico um caminho. <b>Não sou médico, não dou diagnóstico nem receita.</b> Em emergência, ligue <b>188 (CVV)</b> ou <b>192 (SAMU)</b>.</p>
        <p style={{ fontSize: 13, color: "#555" }}>Não guardamos sua conversa. Ao continuar, você concorda em conversar com um assistente de IA de apoio.</p>
        <button onClick={() => setConsent(true)} style={{ background: teal, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", cursor: "pointer" }}>Começar a conversar</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      {crisis && (
        <div role="alert" style={{ background: "#FDECEC", border: "1px solid #E57373", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <b>Sua vida importa. Procure ajuda agora:</b>
          <ul>{crisis.map((r) => <li key={r.nome}><b>{r.nome}</b> — {r.contato}. {r.descricao}</li>)}</ul>
        </div>
      )}
      <div style={{ minHeight: 280 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: "8px 0" }}>
            <span style={{ display: "inline-block", padding: "10px 14px", borderRadius: 14, background: m.role === "user" ? teal : "#EDF9FB", color: m.role === "user" ? "#fff" : "#0D1117", maxWidth: "85%" }}>{m.content || "…"}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escreva o que está sentindo…" style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ccc" }} />
        <button onClick={send} disabled={busy} style={{ background: teal, color: "#fff", border: "none", borderRadius: 10, padding: "0 18px", cursor: "pointer" }}>Enviar</button>
      </div>
    </div>
  );
}
