# ---------- Build Stage ----------
# Build the React application.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for better Docker caching.
COPY package*.json ./
RUN npm ci --silent

COPY . .

# Backend API URL passed during image build.
# ARG VITE_API_URL=http://fincore-backend:5000
# ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Production Stage ----------
# Serve the React app using Nginx.
FROM nginx:alpine AS production

# Nginx configuration for React routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the production build.
COPY --from=builder /app/dist /usr/share/nginx/html

# Set permissions for OpenShift's non-root execution.
RUN chmod -R 777 /var/cache/nginx /var/run /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 8080

# Health check used by OpenShift/Kubernetes.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080 || exit 1

# Start Nginx.
CMD ["nginx", "-g", "daemon off;"]