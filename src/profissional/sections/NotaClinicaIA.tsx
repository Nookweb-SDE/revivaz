import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles, Save, AlertCircle } from "lucide-react";
import { T, card, btnPrimary, btnGhost } from "../../conta/ui";
import { gerarNotaIA, profSalvarObsClinica } from "../../lib/data";

// Web Speech API (ditado local no navegador — SEM gravação no servidor).
// Tipado como any p/ não exigir lib extra; degrada se indisponível.
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
declare global {
  interface Window {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
  }
}
function getSpeechCtor(): (new () => SR) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

const disclaimer: React.CSSProperties = {
  fontSize: 11,
  color: T.gray600,
  fontFamily: "'Nunito',sans-serif",
  lineHeight: 1.4,
  margin: "6px 0 0",
};

/**
 * Nota clínica assistida por IA (pós-atendimento). O profissional dita (local) ou
 * digita o que observou; a IA estrutura; o profissional revisa e salva na consulta.
 * Nenhum áudio/vídeo é gravado/armazenado — só o texto revisado é salvo.
 */
export default function NotaClinicaIA({
  consultaId,
  onSalvo,
}: {
  consultaId: string;
  onSalvo?: () => void;
}): JSX.Element {
  const [anotacoes, setAnotacoes] = useState("");
  const [nota, setNota] = useState("");
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const recRef = useRef<SR | null>(null);
  const baseRef = useRef("");

  const speechDisponivel = Boolean(getSpeechCtor());

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  function toggleDitado() {
    setErro(null);
    if (ouvindo) {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
      return;
    }
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = anotacoes ? anotacoes.trimEnd() + " " : "";
    rec.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) {
        txt += e.results[i][0].transcript;
      }
      setAnotacoes(baseRef.current + txt);
    };
    rec.onerror = () => setOuvindo(false);
    rec.onend = () => setOuvindo(false);
    recRef.current = rec;
    try {
      rec.start();
      setOuvindo(true);
    } catch {
      setOuvindo(false);
      setErro("Não foi possível iniciar o ditado.");
    }
  }

  async function gerar() {
    if (!anotacoes.trim() || gerando) return;
    setGerando(true);
    setErro(null);
    setOk(false);
    try {
      const r = await gerarNotaIA(consultaId, anotacoes.trim());
      setNota(r);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gerar a nota.");
    } finally {
      setGerando(false);
    }
  }

  async function salvar() {
    if (!nota.trim() || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await profSalvarObsClinica(consultaId, nota.trim());
      setOk(true);
      onSalvo?.();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 12,
    border: `1.5px solid ${T.gray200}`,
    padding: "10px 12px",
    fontFamily: "'Nunito',sans-serif",
    fontSize: 14,
    color: T.gray950,
    background: T.gray050,
    resize: "vertical",
    lineHeight: 1.5,
    outline: "none",
  };

  return (
    <div style={{ ...card, background: T.teal050, border: `1px solid ${T.teal100}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Sparkles size={16} color={T.teal700} aria-hidden="true" />
        <span
          style={{
            fontFamily: "'Nunito',sans-serif",
            fontWeight: 800,
            fontSize: 14,
            color: T.teal900,
          }}
        >
          Nota clínica assistida por IA
        </span>
      </div>

      {/* anotações / ditado */}
      <label
        htmlFor={`anot-${consultaId}`}
        style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.gray700, marginBottom: 6 }}
      >
        Suas anotações do atendimento
      </label>
      <textarea
        id={`anot-${consultaId}`}
        value={anotacoes}
        onChange={(e) => setAnotacoes(e.target.value)}
        rows={4}
        placeholder="Digite ou use o ditado para registrar o que observou…"
        style={inputStyle}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {speechDisponivel && (
          <button
            type="button"
            onClick={toggleDitado}
            aria-pressed={ouvindo}
            style={{
              ...btnGhost,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1.5px solid ${ouvindo ? T.red : T.teal300}`,
              borderRadius: 10,
              padding: "8px 12px",
              color: ouvindo ? T.red : T.teal700,
            }}
          >
            {ouvindo ? <MicOff size={15} /> : <Mic size={15} />}
            {ouvindo ? "Parar ditado" : "Ditar"}
          </button>
        )}
        <button
          type="button"
          onClick={gerar}
          disabled={!anotacoes.trim() || gerando}
          style={{
            ...btnPrimary,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: !anotacoes.trim() || gerando ? 0.55 : 1,
            cursor: !anotacoes.trim() || gerando ? "not-allowed" : "pointer",
          }}
        >
          <Sparkles size={15} aria-hidden="true" />
          {gerando ? "Gerando…" : "Gerar nota com IA"}
        </button>
      </div>
      <p style={disclaimer}>
        Rascunho gerado por IA a partir das suas anotações — revise antes de salvar.
        Nenhum áudio ou vídeo é gravado; o ditado acontece no seu navegador.
      </p>

      {/* nota gerada (editável) */}
      {nota && (
        <div style={{ marginTop: 14 }}>
          <label
            htmlFor={`nota-${consultaId}`}
            style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.gray700, marginBottom: 6 }}
          >
            Nota (revise e edite antes de salvar)
          </label>
          <textarea
            id={`nota-${consultaId}`}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={8}
            style={{ ...inputStyle, background: T.white }}
          />
          <button
            type="button"
            onClick={salvar}
            disabled={!nota.trim() || salvando}
            style={{
              ...btnPrimary,
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: !nota.trim() || salvando ? 0.55 : 1,
            }}
          >
            <Save size={15} aria-hidden="true" />
            {salvando ? "Salvando…" : "Salvar na consulta"}
          </button>
        </div>
      )}

      {erro && (
        <div
          role="alert"
          style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, color: T.red, fontSize: 13, fontFamily: "'Nunito',sans-serif" }}
        >
          <AlertCircle size={15} aria-hidden="true" />
          {erro}
        </div>
      )}
      {ok && (
        <div
          role="status"
          style={{ marginTop: 10, color: T.teal700, fontSize: 13, fontWeight: 700, fontFamily: "'Nunito',sans-serif" }}
        >
          Nota salva na consulta 💚
        </div>
      )}
    </div>
  );
}
