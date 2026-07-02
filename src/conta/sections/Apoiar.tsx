import React, { useState } from "react";
import { ArrowLeft, Copy, Check, Heart, QrCode } from "lucide-react";
import { T, card, btnPrimary, btnGhost, sectionTitle } from "../ui";

// ─── constants ───────────────────────────────────────────────────────────────

const PIX_CHAVE = "admin@revivaz.com.br";

/** teal-600 conforme especificado no brief */
const VERDE = "#0d9488";

const VALORES = [
  { label: "R$10", valor: 10 },
  { label: "R$25", valor: 25 },
  { label: "R$50", valor: 50 },
  { label: "R$100", valor: 100 },
];

// ─── animations ──────────────────────────────────────────────────────────────

const CSS_ANIMACOES = `
  @keyframes apoiar-heartbeat {
    0%   { transform: scale(1); }
    14%  { transform: scale(1.24); }
    28%  { transform: scale(0.96); }
    42%  { transform: scale(1.14); }
    70%  { transform: scale(1); }
    100% { transform: scale(1); }
  }
  @keyframes apoiar-fadein {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes apoiar-pop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.12); }
    100% { transform: scale(1);   opacity: 1; }
  }
`;

// ─── Chip de valor ────────────────────────────────────────────────────────────

function Chip({
  label,
  ativo,
  onClick,
}: {
  label: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      style={{
        padding: "10px 20px",
        borderRadius: 10,
        border: ativo ? `2px solid ${VERDE}` : `2px solid ${T.gray200}`,
        background: ativo ? "#f0fdf4" : T.white,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        fontSize: 14,
        color: ativo ? VERDE : T.gray700,
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s, color 0.15s",
        minHeight: 44,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

// ─── Tela de agradecimento ────────────────────────────────────────────────────

function TelaAgradecimento({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "36px 20px",
        borderRadius: 20,
        background: T.white,
        border: `1.5px solid ${T.teal100}`,
        textAlign: "center",
        animation: "apoiar-fadein 0.3s ease-out",
        boxShadow: "0 2px 12px rgba(0,0,0,.06)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          fontSize: 52,
          lineHeight: 1,
          animation: "apoiar-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        💚
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 800,
          fontSize: 22,
          color: T.teal900,
          lineHeight: 1.2,
        }}
      >
        Obrigado de coração!
      </h2>
      <p
        style={{
          margin: 0,
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          color: T.teal700,
          lineHeight: 1.6,
          maxWidth: 270,
        }}
      >
        Você ajudou alguém a ter acesso à saúde mental. Isso importa mais do
        que você imagina.
      </p>
      <button
        type="button"
        onClick={onVoltar}
        style={{
          ...btnGhost,
          marginTop: 6,
          fontSize: 14,
          fontWeight: 700,
          color: T.gray600,
          padding: "8px 16px",
          borderRadius: 10,
          border: `1px solid ${T.gray200}`,
          minHeight: 40,
        }}
      >
        Voltar ao início
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Apoiar({
  onFechar,
}: {
  onFechar: () => void;
}): JSX.Element {
  const [copiado, setCopiado] = useState(false);
  const [valorIdx, setValorIdx] = useState<number | null>(null);
  const [outroSelecionado, setOutroSelecionado] = useState(false);
  const [outroValor, setOutroValor] = useState("");
  const [agradecido, setAgradecido] = useState(false);

  async function copiarChave() {
    try {
      await navigator.clipboard.writeText(PIX_CHAVE);
    } catch {
      // clipboard unavailable — key is still visible for manual copy
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2600);
  }

  function selecionarValor(idx: number) {
    setValorIdx(idx);
    setOutroSelecionado(false);
    setOutroValor("");
  }

  function selecionarOutro() {
    setValorIdx(null);
    setOutroSelecionado(true);
  }

  function handleAgradecido() {
    setAgradecido(true);
  }

  return (
    <section
      aria-label="Apoiar a Revivaz"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        margin: "-20px -16px -80px",
        padding: "20px 16px 80px",
        minHeight: "100vh",
        background: "#f0fdf4",
      }}
    >
      <style>{CSS_ANIMACOES}</style>

      {/* ── Topbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          aria-label="Voltar"
          onClick={onFechar}
          style={{
            ...btnGhost,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 0",
            fontSize: 14,
            color: T.teal700,
          }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Voltar
        </button>
        <h1
          style={{
            ...sectionTitle,
            margin: 0,
            flex: 1,
            textAlign: "right",
            fontSize: 14,
            fontWeight: 700,
            color: T.teal700,
          }}
        >
          Apoiar a Revivaz
        </h1>
      </div>

      {agradecido ? (
        <TelaAgradecimento onVoltar={onFechar} />
      ) : (
        <>
          {/* ── Hero ── */}
          <div
            style={{
              ...card,
              borderColor: T.teal100,
              padding: "28px 20px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: `linear-gradient(135deg, #34d399 0%, ${VERDE} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 20px rgba(13,148,136,0.28)`,
                animation: "apoiar-heartbeat 2.6s ease-in-out infinite",
                marginBottom: 4,
              }}
            >
              <Heart
                size={30}
                color="#ffffff"
                fill="#ffffff"
                strokeWidth={0}
                aria-hidden="true"
              />
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: T.teal900,
                lineHeight: 1.2,
                textWrap: "balance" as React.CSSProperties["textWrap"],
              }}
            >
              Apoie a Revivaz 💚
            </h2>
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                color: T.gray600,
                lineHeight: 1.6,
                maxWidth: 290,
                textWrap: "balance" as React.CSSProperties["textWrap"],
              }}
            >
              Cada doação permite que mais pessoas acessem saúde mental
              gratuita.
            </p>
          </div>

          {/* ── Valores sugeridos ── */}
          <div style={{ ...card, borderColor: T.teal100 }}>
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: T.gray950,
              }}
            >
              Quanto você quer contribuir?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VALORES.map((v, idx) => (
                <Chip
                  key={v.label}
                  label={v.label}
                  ativo={valorIdx === idx && !outroSelecionado}
                  onClick={() => selecionarValor(idx)}
                />
              ))}
              <Chip
                label="Outro valor"
                ativo={outroSelecionado}
                onClick={selecionarOutro}
              />
            </div>

            {outroSelecionado && (
              <div
                style={{
                  marginTop: 12,
                  animation: "apoiar-fadein 0.2s ease-out",
                }}
              >
                <label
                  htmlFor="apoiar-outro"
                  style={{
                    display: "block",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    color: T.gray600,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    marginBottom: 6,
                  }}
                >
                  Valor em reais
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: T.white,
                    border: `1.5px solid ${T.teal300}`,
                    borderRadius: 10,
                    padding: "0 14px",
                    maxWidth: 180,
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: T.teal700,
                      marginRight: 6,
                      userSelect: "none",
                    }}
                  >
                    R$
                  </span>
                  <input
                    id="apoiar-outro"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={outroValor}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    onChange={(e) => setOutroValor(e.target.value)}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontFamily: "'Nunito', sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: T.gray950,
                      background: "transparent",
                      padding: "11px 0",
                      minWidth: 0,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── PIX ── */}
          <div style={{ ...card, borderColor: T.teal100 }}>
            <p
              style={{
                margin: "0 0 12px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: T.teal700,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              PIX para doação
            </p>

            {/* Chave + botão copiar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#f0fdf4",
                border: `1.5px solid ${T.teal100}`,
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 14,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 600,
                    fontSize: 11,
                    color: T.gray600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Chave PIX (e-mail)
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: T.teal900,
                    wordBreak: "break-all",
                    userSelect: "text",
                  }}
                >
                  {PIX_CHAVE}
                </p>
              </div>
              <button
                type="button"
                onClick={copiarChave}
                aria-label={
                  copiado ? "Chave PIX copiada" : "Copiar chave PIX"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: copiado ? T.teal050 : VERDE,
                  color: copiado ? T.teal700 : "#ffffff",
                  border: copiado ? `1.5px solid ${T.teal300}` : "none",
                  borderRadius: 10,
                  padding: "9px 14px",
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.2s, color 0.2s, border 0.2s",
                  minHeight: 40,
                }}
              >
                {copiado ? (
                  <>
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    Copiada!
                  </>
                ) : (
                  <>
                    <Copy size={14} strokeWidth={2.2} aria-hidden="true" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* QR Code placeholder */}
            <div
              role="img"
              aria-label="QR Code disponível em breve"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                background: T.gray050,
                border: `1.5px dashed ${T.teal100}`,
                borderRadius: 12,
                padding: "24px 16px",
                minHeight: 112,
              }}
            >
              <QrCode
                size={40}
                color={T.teal300}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 600,
                  fontSize: 12.5,
                  color: T.gray600,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                QR Code disponível em breve
              </p>
            </div>
          </div>

          {/* ── Texto de impacto ── */}
          <div
            style={{
              ...card,
              borderColor: T.teal100,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#f0fdf4",
                border: `1px solid ${T.teal100}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Heart
                size={16}
                color={VERDE}
                fill={VERDE}
                strokeWidth={0}
                aria-hidden="true"
              />
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 600,
                fontSize: 13.5,
                color: T.gray700,
                lineHeight: 1.6,
              }}
            >
              Com{" "}
              <strong style={{ color: VERDE, fontWeight: 800 }}>R$50</strong>{" "}
              você patrocina{" "}
              <strong style={{ color: T.teal900, fontWeight: 800 }}>
                1 consulta
              </strong>{" "}
              para alguém que não pode pagar.
            </p>
          </div>

          {/* ── Já doei button ── */}
          <button
            type="button"
            onClick={handleAgradecido}
            style={{
              ...btnPrimary,
              width: "100%",
              background: VERDE,
              borderRadius: 14,
              minHeight: 52,
              fontSize: 16,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 20px",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            <Heart
              size={18}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden="true"
            />
            Já doei — obrigado!
          </button>

          {/* ── Disclaimer ── */}
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito', sans-serif",
              fontSize: 11.5,
              fontWeight: 500,
              color: T.gray600,
              lineHeight: 1.55,
              textAlign: "center",
            }}
          >
            A doação é voluntária e não gera obrigações para nenhuma das
            partes. Integração automática disponível em breve.
          </p>
        </>
      )}
    </section>
  );
}
