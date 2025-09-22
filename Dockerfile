# Multi-stage Dockerfile for ELADWYSOFT-SimpleIT
# Based on Ubuntu deployment script - using Node.js 22 LTS
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Install specific dependencies matching deployment script
RUN npm install @neondatabase/serverless drizzle-orm drizzle-kit

# Audit and fix vulnerabilities (matching deployment script)
RUN npm audit fix --audit-level=moderate || true

# Copy frontend source and config files
COPY client/ ./client/
COPY shared/ ./shared/
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY tsconfig.json ./
COPY components.json ./

# Build frontend only (vite build)
RUN npx vite build

# Stage 2: Build backend
FROM node:22-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Install specific dependencies matching deployment script  
RUN npm install @neondatabase/serverless drizzle-orm drizzle-kit

# Audit and fix vulnerabilities (matching deployment script)
RUN npm audit fix --audit-level=moderate || true

# Copy backend source
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./
COPY vite.config.ts ./
COPY tsconfig.json ./

# Build backend only (esbuild)
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Stage 3: Production runtime
FROM node:22-alpine AS production

# Create app directory
WORKDIR /app

# Create non-root user for security (matching deployment script user creation)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S simpleit -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
# Install all dependencies first, then remove dev-only ones we don't need
RUN npm install && npm prune --omit=dev
# Keep vite and other build-time dependencies that are needed at runtime
RUN npm install vite @vitejs/plugin-react
# Install drizzle-kit for database migrations
RUN npm install drizzle-kit

# Clean npm cache to reduce image size
RUN npm cache clean --force

# Copy built application
COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/dist/public ./dist/public

# Copy any additional runtime files
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Change ownership to non-root user
RUN chown -R simpleit:nodejs /app
USER simpleit

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the application
CMD ["node", "dist/index.js"]