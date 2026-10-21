// Envio de e-mail pelo SMTP da Revivaz (nodemailer). Um só ponto de saída para
// o servidor inteiro: quem chama não sabe se foi SMTP ou console.
import nodemailer from "nodemailer";
import { existsSync } from "fs";
import path from "path";
import { DIST, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } from "../config";

export interface EmailSaida {
  para: string;
  assunto: string;
  html: string;
  texto: string;
}

export type ResultadoEnvio = { ok: true; via: "smtp" | "console" } | { ok: false; erro: string };

/** Cadeado 3D anexado por CID: Gmail e Outlook bloqueiam imagem em data: URI. */
function anexoCadeado() {
  const noBuild = path.join(DIST, "cadeado-revivaz.png");
  const noFonte = path.join(DIST, "..", "public", "cadeado-revivaz.png");
  const arquivo = existsSync(noBuild) ? noBuild : noFonte;
  return existsSync(arquivo) ? [{ filename: "cadeado.png", path: arquivo, cid: "cadeado@revivaz" }] : [];
}

let transporte: nodemailer.Transporter | null = null;

export async function enviarEmail(m: EmailSaida): Promise<ResultadoEnvio> {
  if (!SMTP_PASS) {
    if (process.env.NODE_ENV === "production") return { ok: false, erro: "SMTP sem senha" };
    // Dev sem senha: o e-mail aparece no console, para dar para testar o fluxo.
    console.log(`[email] (sem SMTP) para=${m.para} assunto="${m.assunto}"\n${m.texto}`);
    return { ok: true, via: "console" };
  }
  try {
    transporte ??= nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporte.sendMail({
      from: EMAIL_FROM,
      to: m.para,
      subject: m.assunto,
      html: m.html,
      text: m.texto,
      attachments: anexoCadeado(),
    });
    return { ok: true, via: "smtp" };
  } catch (err) {
    const erro = err instanceof Error ? err.message : String(err);
    console.error("[email] falhou:", erro);
    return { ok: false, erro };
  }
}
