# ---------- Build ----------
FROM node:22-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
COPY client/package.json client/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ---------- Runtime ----------
FROM node:22-slim
ENV NODE_ENV=production \
    DB_PATH=/data/bvcross.db \
    PORT=8787
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json server/
RUN pnpm install --frozen-lockfile --prod --filter @bvcross/server

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

# La DB vive en /data: montá un volumen del hosting ahí para persistirla.
# (No usamos la instrucción VOLUME: Railway y otros PaaS la rechazan; el
# volumen se monta desde el panel del hosting en /data.)
EXPOSE 8787

WORKDIR /app/server
CMD ["node", "dist/index.js"]
