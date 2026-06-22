# Build fora da VPS (política Nookweb/izai): imagem pronta, Contabo só roda.
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/acolhimento ./src/acolhimento
COPY tsconfig.json ./
EXPOSE 8080
CMD ["npx", "tsx", "server/server.ts"]
