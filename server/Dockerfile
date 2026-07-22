# ---------- Build Stage ----------
# Install all dependencies and generate Prisma client.
FROM node:20-bookworm-slim AS builder

RUN apt-get update && \
    apt-get install -y openssl ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first to leverage Docker layer caching.
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

RUN npm ci --silent
RUN npx prisma generate

# Copy application source.
COPY . .

# ---------- Production Stage ----------
# Create a lightweight production image.
FROM node:20-bookworm-slim AS production

RUN apt-get update && \
    apt-get install -y openssl ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only production dependencies.
COPY package*.json ./
COPY prisma/schema.prisma ./prisma/

RUN npm ci --omit=dev --silent && \
    npx prisma generate && \
    npm cache clean --force

# Copy application files from the build stage.
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set permissions for OpenShift's non-root execution.
RUN chown -R node:node /app && \
    chmod -R g=u /app

USER node

# Express server port.
EXPOSE 5000

# Health check used by OpenShift/Kubernetes.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:5000/api/health || exit 1

# Start the application.
CMD ["node", "src/server.js"]