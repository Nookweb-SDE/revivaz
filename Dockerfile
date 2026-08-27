# Build fora da VPS (política Nookweb/izai): imagem pronta, Contabo só roda.
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_* são PÚBLICAS (anon + RLS) — passadas como build-arg (a .env é dockerignored).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
# VITE_JITSI_DOMAIN é PÚBLICA (só o domínio da sala; segredo JWT fica server-side).
ARG VITE_JITSI_DOMAIN
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_JITSI_DOMAIN=$VITE_JITSI_DOMAIN
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/acolhimento ./src/acolhimento
# src/video/room.ts é importado pelo server.ts (sala de vídeo) — precisa no runtime.
COPY src/video ./src/video
# src/lib tem a validação de documento, o catálogo de conselhos, o de especialidades
# e a máquina de estados — todos importados pelas rotas.
COPY src/lib ./src/lib
#
# ATENÇÃO: esta lista é um allowlist e já quebrou o deploy DUAS vezes. Toda vez que
# uma rota passar a importar de uma pasta nova de src/, ela precisa entrar aqui,
# senão o container morre no boot com ERR_MODULE_NOT_FOUND. Nenhum teste pega isso:
# a suíte roda do repositório, não da imagem. Confira com:
#   grep -rhoE 'from "\.\./\.\./src/[a-z]+|from "\.\./src/[a-z]+' server/ | sed 's|.*src/||' | sort -u
# src/notificacoes saiu junto com o WhatsApp: não existe mais.
COPY tsconfig.json ./
EXPOSE 8080
CMD ["npx", "tsx", "server/server.ts"]
