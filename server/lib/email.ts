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

/** Logo e cadeado 3D anexados por CID: Gmail e Outlook bloqueiam imagem em data: URI. */
function anexosImagens() {
  const achar = (nome: string) => {
    const noBuild = path.join(DIST, nome);
    const noFonte = path.join(DIST, "..", "public", nome);
    return existsSync(noBuild) ? noBuild : existsSync(noFonte) ? noFonte : null;
  };
  return [
    { nome: "cadeado-revivaz.png", cid: "cadeado@revivaz" },
    { nome: "icon-192.png", cid: "logo@revivaz" },
  ].flatMap(({ nome, cid }) => {
    const arquivo = achar(nome);
    return arquivo ? [{ filename: nome, path: arquivo, cid }] : [];
  });
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
      attachments: anexosImagens(),
    });
    return { ok: true, via: "smtp" };
  } catch (err) {
    const erro = err instanceof Error ? err.message : String(err);
    console.error("[email] falhou:", erro);
    return { ok: false, erro };
  }
}
