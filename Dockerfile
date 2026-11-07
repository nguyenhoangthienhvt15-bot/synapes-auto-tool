# syntax=docker/dockerfile:1

# Stage 1: Build Frontend Bundle
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install

# Build static assets
COPY . .
RUN npm run build

# Stage 2: Production Web Service
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

# Copy runtime files
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit || npm install --omit=dev

# Copy built distribution and server
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY server ./server

EXPOSE 10000

CMD ["node", "server.js"]
