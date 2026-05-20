FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY web/package.json ./web/
COPY mobile/package.json ./mobile/

RUN npm ci --legacy-peer-deps && \
    rm -rf /app/mobile/node_modules/react \
           /app/mobile/node_modules/react-dom \
           /app/mobile/node_modules/react-test-renderer

COPY packages/shared ./packages/shared
COPY mobile ./mobile

WORKDIR /app/mobile
EXPOSE 8081 19000 19001

ENV EXPO_NO_DOTENV=1
CMD ["npx", "expo", "start", "--host", "lan"]