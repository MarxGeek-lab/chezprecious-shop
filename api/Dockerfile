# syntax=docker/dockerfile:1

# npm 11 bloque par défaut les scripts d'installation non approuvés ; ils sont
# nécessaires ici (moteurs Prisma, @tensorflow/tfjs-node).
FROM node:24-bookworm-slim AS deps
WORKDIR /app
ENV npm_config_dangerously_allow_all_scripts=true
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
# URL factice : prisma.config.ts l'exige, mais « generate » ne se connecte pas
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY . .
RUN node node_modules/prisma/build/index.js generate \
 && node ace build \
 && mkdir -p build/app \
 && cp -r app/generated build/app/

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    npm_config_dangerously_allow_all_scripts=true
# OpenSSL : requis par les moteurs Prisma
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/build/package.json /app/build/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/build ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY scripts/create-admin.mjs ./scripts/
COPY docker-entrypoint.sh ./
RUN mkdir -p public/uploads tmp \
 && chown -R node:node public/uploads tmp \
 && chmod +x docker-entrypoint.sh
USER node
EXPOSE 3333
ENTRYPOINT ["./docker-entrypoint.sh"]
