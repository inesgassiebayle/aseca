FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY mobile/package.json ./mobile/

RUN npm ci --legacy-peer-deps

COPY packages/shared ./packages/shared
COPY mobile ./mobile

WORKDIR /app/mobile
EXPOSE 8081 19000 19001

ENV EXPO_NO_DOTENV=1
CMD ["npx", "expo", "start", "--host", "lan"]