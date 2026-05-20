FROM node:20-alpine AS deps
WORKDIR /app
ENV CYPRESS_INSTALL_BINARY=0
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/
COPY mobile/package.json ./mobile/
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY web ./web
RUN npm run build -w @aseca/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/web/.next/standalone ./
COPY --from=builder /app/web/.next/static ./web/.next/static
COPY --from=builder /app/web/public ./web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "web/server.js"]