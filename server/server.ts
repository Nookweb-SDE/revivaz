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
import adminProfissionalRoutes from "./routes/adminProfissional";
import candidaturaRoutes from "./routes/candidatura";
import consultaRoutes from "./routes/consulta";
import devLoginRoutes from "./routes/devLogin";
import leadRoutes from "./routes/lead";
import receitaRoutes from "./routes/receita";
import acolhimentoRoutes from "./routes/acolhimento";
import { leadHits } from "./lib/limitadores";
import { cacheDe, pareceArquivo } from "./lib/estatico";

const app = express();
app.use(express.json({ limit: "256kb" }));

// ─── API ─────────────────────────────────────────────────────────────────────
app.use(adminProfissionalRoutes);
app.use(candidaturaRoutes);
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

// Caminho de API que não existe responde 404 em JSON. Sem isto ele caía no
// fallback de SPA e devolvia a LANDING com status 200 — o que faz uma rota
// removida parecer viva para quem testa de fora.
app.use("/api", (_req, res) => res.status(404).json({ error: "Rota não encontrada" }));

// ─── Estático ────────────────────────────────────────────────────────────────
// /acolhimento é entrada própria do Vite: precisa da rota explícita, senão o
// fallback de SPA devolveria a landing.
app.get("/acolhimento", (_req, res) => res.sendFile(path.join(DIST, "acolhimento.html")));
app.get("/privacidade", (_req, res) => res.sendFile(path.join(DIST, "privacidade.html")));
app.get("/termos", (_req, res) => res.sendFile(path.join(DIST, "termos.html")));
app.use(express.static(DIST, {
  extensions: ["html"],
  setHeaders: (res, arquivo) => res.setHeader("Cache-Control", cacheDe("/" + path.relative(DIST, arquivo).split(path.sep).join("/"))),
}));
// arquivo que não existe (ex.: /assets da versão anterior) é 404, não a página
app.use((req, res, next) => (pareceArquivo(req.path) ? res.status(404).end() : next()));
// Fallback SPA (Express 5: usar middleware final, não app.get("*"))
app.use((_req, res) => { res.setHeader("Cache-Control", "no-cache"); res.sendFile(path.join(DIST, "index.html")); });

// Não há scheduler de lembrete: o canal era WhatsApp, que saiu do produto.
// Quando existir um canal novo, o lembrete volta como módulo próprio.

// ─── Exports for testing + conditional listen ────────────────────────────────
export { app, leadHits };

const PORT = Number(process.env.PORT) || 8080;
if (!process.env.VITEST) {
  app.listen(PORT, () => console.log(`revivaz on :${PORT}`));
}
