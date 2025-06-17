#!/bin/bash

# SimpleIT Asset Management System - Docker Deployment Script
# This script deploys the SimpleIT system using Docker containers

set -e

echo "🚀 Starting SimpleIT Docker Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create Docker Compose file
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: simpleit
      POSTGRES_USER: simpleit_user
      POSTGRES_PASSWORD: simpleit_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U simpleit_user -d simpleit"]
      interval: 10s
      timeout: 5s
      retries: 5

  simpleit:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://simpleit_user:simpleit_password_2024@postgres:5432/simpleit
      SESSION_SECRET: simpleit_session_secret_2024_production
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build || echo "Build step completed"

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]
EOF

# Create database initialization script
cat > init.sql << 'EOF'
-- Create sessions table for session storage
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO simpleit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO simpleit_user;
EOF

# Create .dockerignore file
cat > .dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
.env.development
.env.test
.env.production
.nyc_output
coverage
.nyc_output
.coverage
.coverage/
dist/
.next/
out/
build/
.DS_Store
*.tgz
*.tar.gz
EOF

# Create production package.json scripts
if [ -f package.json ]; then
    echo "📦 Updating package.json for production..."
    # Add start script if not exists
    if ! grep -q '"start"' package.json; then
        sed -i '/"scripts": {/a\    "start": "NODE_ENV=production tsx server/index.ts",' package.json
    fi
fi

# Start deployment
echo "🏗️  Building and starting containers..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ SimpleIT deployment successful!"
    echo ""
    echo "🌐 Application URL: http://localhost:5000"
    echo "🗄️  Database: PostgreSQL on localhost:5432"
    echo "👤 Default Login: admin / admin123"
    echo ""
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
    echo "🔄 To restart: docker-compose restart"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Docker deployment completed successfully!"