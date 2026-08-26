import React, { useState } from "react";
import { Shield, Lock, X, ChevronDown, CheckCircle } from "lucide-react";
import { T, btnPrimary } from "../ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConsentimentoLGPDProps {
  onAceitar: () => void;
}

// ─── Consent storage shape ────────────────────────────────────────────────────

export interface ConsentRecord {
  v: 1;
  ts: number;
}

export const CONSENT_KEY = "revivaz_lgpd_consent";

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentRecord;
  } catch {
    return null;
  }
}

// ─── Inner: full policy modal ─────────────────────────────────────────────────

function PoliticaCompleta({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Política de Privacidade completa"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4,47,53,0.55)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          background: T.white,
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,77,92,0.28)",
          border: `1px solid ${T.teal100}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${T.gray200}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 800,
              fontSize: 17,
              color: T.gray950,
            }}
          >
            Política de Privacidade
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar política"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1.5px solid ${T.gray200}`,
              background: T.white,
              cursor: "pointer",
              color: T.gray600,
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            padding: "20px 24px 24px",
            overflowY: "auto",
            fontFamily: "'Nunito',sans-serif",
            fontSize: 14,
            color: T.gray600,
            lineHeight: 1.7,
            gap: 0,
          }}
        >
          <Section title="1. Quem somos">
            A Revivaz é uma plataforma de saúde mental que conecta usuários a profissionais licenciados
            no Brasil. Nosso compromisso é com o cuidado, a ética e a proteção dos seus dados.
          </Section>

          <Section title="2. Dados que coletamos">
            Coletamos apenas o necessário: dados de identificação (nome, telefone, e-mail), informações
            de saúde mental compartilhadas nas sessões, histórico de consultas e preferências de
            atendimento. Não coletamos dados desnecessários.
          </Section>

          <Section title="3. Base legal — LGPD Art. 11">
            Seus dados de saúde mental são dados sensíveis nos termos da Lei Geral de Proteção de Dados
            (Lei 13.709/2018, Art. 11). O tratamento é realizado com base no seu <strong>consentimento
            expresso e informado</strong> e na execução do contrato de prestação de serviços de saúde.
          </Section>

          <Section title="4. Como usamos seus dados">
            <ul style={{ margin: "4px 0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Fornecer a plataforma e os recursos de acompanhamento</li>
              <li>Conectar você ao profissional de saúde escolhido</li>
              <li>Enviar lembretes de consulta (com sua permissão)</li>
              <li>Melhorar continuamente o atendimento (dados anonimizados)</li>
            </ul>
          </Section>

          <Section title="5. O que NÃO fazemos">
            <ul style={{ margin: "4px 0 0 16px", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Nunca vendemos seus dados a terceiros</li>
              <li>Não compartilhamos com seguradoras, empregadores ou anunciantes</li>
              <li>Não usamos seus dados clínicos para fins publicitários</li>
            </ul>
          </Section>

          <Section title="6. Segurança e criptografia">
            Dados clínicos são armazenados criptografados em repouso e em trânsito (TLS 1.3+).
            O acesso é estritamente restrito a você e ao profissional que te atende. Nenhum outro
            funcionário acessa conteúdo de sessões sem sua autorização.
          </Section>

          <Section title="7. Seus direitos">
            Você pode, a qualquer momento: confirmar se tratamos seus dados, acessar uma cópia,
            corrigir informações imprecisas, solicitar a exclusão completa e revogar este consentimento.
            Entre em contato via <strong>privacidade@revivaz.com.br</strong>.
          </Section>

          <Section title="8. Retenção de dados">
            Dados clínicos são retidos pelo período mínimo exigido pelas normas do CFM e CFP (mínimo
            5 anos após o encerramento do atendimento). Após esse prazo, são excluídos de forma segura.
          </Section>

          <p
            style={{
              marginTop: 20,
              fontSize: 12,
              color: T.gray600,
              fontStyle: "italic",
              borderTop: `1px solid ${T.gray200}`,
              paddingTop: 16,
            }}
          >
            Última atualização: julho de 2026. Para dúvidas, acesse nossa Central de Privacidade
            ou escreva para privacidade@revivaz.com.br.
          </p>
        </div>

        <div style={{ padding: "12px 24px 20px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...btnPrimary,
              width: "100%",
              fontSize: 14,
              fontFamily: "'Nunito',sans-serif",
              fontWeight: 700,
              borderRadius: 12,
              minHeight: 48,
              background: `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal700} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p
        style={{
          margin: "0 0 6px",
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 800,
          fontSize: 14,
          color: T.gray950,
        }}
      >
        {title}
      </p>
      <div
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontSize: 14,
          color: T.gray600,
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Protection point row ─────────────────────────────────────────────────────

function ProtectionPoint({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <CheckCircle
        size={16}
        color={T.teal700}
        strokeWidth={2.5}
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 2 }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 500,
          fontSize: 13.5,
          color: T.gray700,
          lineHeight: 1.55,
        }}
      >
        {text}
      </p>
    </div>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────

interface CheckRowProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  required?: boolean;
  children: React.ReactNode;
}

function CheckRow({ id, checked, onChange, required, children }: CheckRowProps) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        cursor: "pointer",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1.5px solid ${checked ? T.teal700 : T.gray200}`,
        background: checked ? T.teal050 : T.white,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          marginTop: 1,
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `2px solid ${checked ? T.teal700 : T.gray200}`,
          background: checked ? T.teal700 : T.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "border-color 0.15s, background 0.15s",
        }}
        aria-hidden="true"
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
            <path
              d="M1 4.5L4 7.5L10 1.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
        aria-checked={checked}
      />
      <span
        style={{
          fontFamily: "'Nunito',sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: T.gray700,
          lineHeight: 1.55,
        }}
      >
        {children}
      </span>
    </label>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function ConsentimentoLGPD({ onAceitar }: ConsentimentoLGPDProps) {
  const [termos, setTermos] = useState(false);
  const [politicaAberta, setPoliticaAberta] = useState(false);

  function handleAceitar() {
    if (!termos) return;
    const record: ConsentRecord = { v: 1, ts: Date.now() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    onAceitar();
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Consentimento de dados — LGPD"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(4,47,53,0.6)",
          backdropFilter: "blur(5px)",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            maxHeight: "92vh",
            background: T.white,
            borderRadius: 22,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 32px 96px rgba(0,77,92,0.32), 0 4px 16px rgba(0,0,0,0.1)",
            border: `1px solid ${T.teal100}`,
            overflow: "hidden",
          }}
        >
          {/* Top stripe */}
          <div
            style={{
              height: 4,
              background: `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal500} 100%)`,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />

          {/* Scrollable content */}
          <div
            style={{
              overflowY: "auto",
              padding: "28px 28px 8px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {/* Icon + title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: T.teal050,
                  border: `1.5px solid ${T.teal100}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Shield size={28} color={T.teal700} strokeWidth={1.8} />
              </div>
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 800,
                    fontSize: 21,
                    color: T.gray950,
                    lineHeight: 1.2,
                    textWrap: "balance",
                  } as React.CSSProperties}
                >
                  Seus dados estão protegidos
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 500,
                    fontSize: 13.5,
                    color: T.gray600,
                    lineHeight: 1.5,
                  }}
                >
                  Antes de continuar, leia como cuidamos das suas informações.
                </p>
              </div>
            </div>

            {/* Protection points */}
            <div
              style={{
                background: T.teal050,
                border: `1.5px solid ${T.teal100}`,
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <Lock size={13} color={T.teal700} strokeWidth={2.5} aria-hidden="true" />
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 800,
                    fontSize: 11,
                    color: T.teal700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  LGPD Art. 11 — Dados sensíveis de saúde
                </p>
              </div>

              <ProtectionPoint
                text="Seus dados de saúde mental são SENSÍVEIS e protegidos pela LGPD (Art. 11). Tratamos com base no seu consentimento expresso."
              />
              <ProtectionPoint
                text="Usamos seus dados apenas para: fornecer o serviço, conectar com profissionais e melhorar o atendimento."
              />
              <ProtectionPoint
                text="Nunca vendemos seus dados. Você pode solicitar exclusão completa a qualquer momento."
              />
              <ProtectionPoint
                text="Dados clínicos ficam criptografados e acessíveis APENAS a você e ao seu profissional de saúde."
              />
            </div>

            {/* Checkboxes */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <CheckRow
                id="lgpd-termos"
                checked={termos}
                onChange={setTermos}
                required
              >
                Li e aceito os{" "}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPoliticaAberta(true); }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    fontFamily: "'Nunito',sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: T.teal700,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  Termos de Uso e a Política de Privacidade
                </button>
              </CheckRow>

              {/* O opt-in de lembrete por WhatsApp saiu: o canal não existe mais. */}
            </div>

            {/* Policy link */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setPoliticaAberta(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  padding: "4px 0",
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: T.teal700,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
                aria-label="Ver Política de Privacidade completa"
              >
                <ChevronDown size={14} aria-hidden="true" />
                Ver Política completa
              </button>
            </div>
          </div>

          {/* Footer CTA — always visible */}
          <div
            style={{
              padding: "16px 28px 24px",
              flexShrink: 0,
              borderTop: `1px solid ${T.gray100}`,
              background: T.white,
            }}
          >
            <button
              type="button"
              onClick={handleAceitar}
              disabled={!termos}
              aria-disabled={!termos}
              style={{
                ...btnPrimary,
                width: "100%",
                fontSize: 15,
                fontFamily: "'Nunito',sans-serif",
                fontWeight: 800,
                borderRadius: 14,
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: termos
                  ? `linear-gradient(90deg, ${T.teal900} 0%, ${T.teal700} 100%)`
                  : T.teal100,
                color: termos ? T.white : T.teal300,
                cursor: termos ? "pointer" : "not-allowed",
                boxShadow: termos ? "0 4px 14px rgba(0,122,140,0.28)" : "none",
                transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
                border: "none",
              }}
            >
              <Shield size={16} aria-hidden="true" />
              Concordar e continuar
            </button>

            {!termos && (
              <p
                aria-live="polite"
                style={{
                  margin: "8px 0 0",
                  fontFamily: "'Nunito',sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: T.gray600,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                Marque a caixa acima para continuar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inner modal: full policy */}
      {politicaAberta && (
        <PoliticaCompleta onClose={() => setPoliticaAberta(false)} />
      )}
    </>
  );
}
