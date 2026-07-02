import React, { useEffect, useRef } from "react";
import { Phone, CalendarPlus } from "lucide-react";
import { T } from "../ui";

interface Props {
  onAgendar: () => void;
  onContinuar: () => void;
}

/**
 * CriseForcada — tela fullscreen exibida quando PHQ-9 item 9 > 0 OU
 * score >= 20 (severidade "grave"). Aparece ANTES do resultado normal e
 * garante que o usuário veja os recursos de crise imediatamente.
 *
 * Props:
 *  onAgendar  — navega para o fluxo de agendamento de consulta.
 *  onContinuar — fecha esta tela e exibe o resultado da autoavaliação.
 */
export default function CriseForcada({ onAgendar, onContinuar }: Props): JSX.Element {
  const firstBtnRef = useRef<HTMLAnchorElement>(null);

  // Move foco para o primeiro botão de ligação ao montar (a11y).
  useEffect(() => {
    firstBtnRef.current?.focus();
  }, []);

  const callBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 56,
    borderRadius: 14,
    background: "#dc2626",
    color: "#ffffff",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 16,
    textDecoration: "none",
    boxShadow: "0 2px 8px rgba(220,38,38,.25)",
    letterSpacing: 0.15,
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Atenção: recursos de crise disponíveis"
      aria-live="assertive"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fef2f2",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "36px 16px 60px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Ícone decorativo */}
        <div
          aria-hidden="true"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#fee2e2",
            border: "2px solid #fca5a5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            fontSize: 28,
          }}
        >
          💚
        </div>

        {/* Título e subtítulo */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: "#111827",
              margin: "0 0 10px",
              lineHeight: 1.35,
            }}
          >
            Você não está sozinho(a) 💚
          </h1>
          <p
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: 14.5,
              fontWeight: 600,
              color: "#4b5563",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Detectamos sinais de que você pode estar passando por um momento muito difícil.
          </p>
        </div>

        {/* Botões de ligação — 56px de altura, touch-friendly */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a
            ref={firstBtnRef}
            href="tel:188"
            aria-label="Ligar agora para o CVV, Centro de Valorização da Vida, número 188"
            style={callBtnStyle}
          >
            <Phone size={20} aria-hidden="true" />
            Ligar agora — CVV 188
          </a>

          <a
            href="tel:192"
            aria-label="Ligar agora para o SAMU, Serviço de Atendimento Móvel de Urgência, número 192"
            style={callBtnStyle}
          >
            <Phone size={20} aria-hidden="true" />
            Ligar agora — SAMU 192
          </a>

          <a
            href="tel:136"
            aria-label="Ligar para Disque Saúde, número 136"
            style={callBtnStyle}
          >
            <Phone size={20} aria-hidden="true" />
            Disque Saúde — 136
          </a>
        </div>

        {/* Legenda dos serviços */}
        <p
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            color: "#6b7280",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Esses serviços são gratuitos, 24 horas, 7 dias por semana.
        </p>

        {/* Separador */}
        <div
          role="separator"
          aria-hidden="true"
          style={{ borderTop: "1.5px solid #fca5a5" }}
        />

        {/* Botão secundário: agendar consulta */}
        <button
          type="button"
          onClick={onAgendar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 48,
            borderRadius: 12,
            background: T.teal700,
            color: "#ffffff",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            boxShadow: `0 2px 8px ${T.teal700}44`,
          }}
        >
          <CalendarPlus size={18} aria-hidden="true" />
          Quero agendar uma consulta
        </button>

        {/* Botão terciário: continuar para o resultado */}
        <button
          type="button"
          onClick={onContinuar}
          style={{
            background: "transparent",
            border: "none",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: "#9ca3af",
            cursor: "pointer",
            textDecoration: "underline",
            padding: "4px 0",
            textAlign: "center",
          }}
        >
          Continuar vendo meu resultado
        </button>
      </div>
    </div>
  );
}
