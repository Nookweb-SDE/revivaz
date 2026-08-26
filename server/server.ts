// Servidor Node (Contabo). Este arquivo é só a MONTAGEM: sobe o Express, pluga
// os routers, serve o build estático e liga o scheduler. Nenhuma regra de
// negócio mora aqui — cada rota tem seu módulo em `routes/`, e o que não é
// rota está em `config.ts` e `lib/`.
//
// Ordem dos handlers importa: as rotas da API vêm ANTES do estático e do
// fallback de SPA, senão o index.html engoliria /api/*.
import express from "express";
import path from "path";
import { DIST } from "./config";
import waRoutes from "./routes/wa";
import adminProfissionalRoutes from "./routes/adminProfissional";
import consultaRoutes from "./routes/consulta";
import devLoginRoutes from "./routes/devLogin";
import leadRoutes from "./routes/lead";
import receitaRoutes from "./routes/receita";
import acolhimentoRoutes from "./routes/acolhimento";
import { otpStore, startRateMap } from "./lib/otp";
import { leadHits } from "./lib/limitadores";

const app = express();
app.use(express.json({ limit: "256kb" }));

// ─── API ─────────────────────────────────────────────────────────────────────
app.use(waRoutes);
app.use(adminProfissionalRoutes);
app.use(consultaRoutes);
app.use(devLoginRoutes);
app.use(leadRoutes);
app.use(receitaRoutes);
app.use(acolhimentoRoutes);

// ─── Saúde ───────────────────────────────────────────────────────────────────
// Sonda pública e barata: responde só "o processo está de pé e servindo".
// Existe porque o Jitsi ficou 7 semanas fora do ar sem ninguém perceber — é o
// alvo do healthcheck do Docker e de qualquer monitor externo.
// Não expõe nada de configuração: um monitor não precisa saber o que está ligado.
app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

// ─── Estático ────────────────────────────────────────────────────────────────
// /acolhimento era entrada própria do Vite (chat aberto ao público). Saiu de
// circulação: quem tem o link antigo vai para a conta, onde a IA continua.
app.get("/acolhimento", (_req, res) => res.redirect(302, "/conta"));
app.use(express.static(DIST, { extensions: ["html"] }));
// Fallback SPA (Express 5: usar middleware final, não app.get("*"))
app.use((_req, res) => res.sendFile(path.join(DIST, "index.html")));

// ─── Scheduler do lembrete (24h antes) ───────────────────────────────────────
// O módulo se agenda sozinho ao ser importado (mesmo comportamento de antes da
// decomposição). Importar aqui é o que liga o scheduler.
import "./lembrete";

// ─── Exports for testing + conditional listen ────────────────────────────────
export { app, otpStore, startRateMap, leadHits };

const PORT = Number(process.env.PORT) || 8080;
if (!process.env.VITEST) {
  app.listen(PORT, () => console.log(`revivaz on :${PORT}`));
}
