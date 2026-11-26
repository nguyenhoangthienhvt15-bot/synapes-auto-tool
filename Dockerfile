# syntax=docker/dockerfile:1

# Stage 1: Build Frontend Bundle
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install

# Build static assets
COPY . .
ARG VITE_PARTY_A_ID_NUMBER=""
ENV VITE_PARTY_A_ID_NUMBER=${VITE_PARTY_A_ID_NUMBER}
RUN npm run build

# Stage 2: Production Web Service
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy runtime files
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit || npm install --omit=dev

# Copy built distribution and server + runtime data dir
COPY --from=builder /app/dist ./dist
RUN mkdir -p ./data
COPY server.js ./
COPY server ./server
COPY google-apps-script ./google-apps-script
COPY workflows ./workflows

EXPOSE 10000

CMD ["node", "server.js"]
