#!/bin/bash

# SimpleIT Deployment Script
# This script automates the deployment of SimpleIT using Docker and Docker Compose

# Configuration
DB_PASSWORD="simpleit_secure_password"  # Change this to a secure password
SESSION_SECRET="simpleit_session_secret_$(date +%s%N | sha256sum | base64 | head -c 32)"

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}SimpleIT Docker Deployment Script${NC}"
echo "----------------------------------------"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Create docker-compose.yml
echo -e "${BLUE}Creating docker-compose.yml file...${NC}"
cat > docker-compose.yml << EOL
version: '3.8'

services:
  # PostgreSQL database
  postgres:
    image: postgres:14
    container_name: simpleit-postgres
    restart: always
    environment:
      POSTGRES_USER: simpleituser
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: simpleit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U simpleituser -d simpleit"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SimpleIT application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: simpleit-app
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://simpleituser:${DB_PASSWORD}@postgres:5432/simpleit
      SESSION_SECRET: ${SESSION_SECRET}
    ports:
      - "80:3000"
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
EOL

# Create Dockerfile
echo -e "${BLUE}Creating Dockerfile...${NC}"
cat > Dockerfile << EOL
# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
EOL

# Build and start containers
echo -e "${BLUE}Building and starting Docker containers...${NC}"
docker-compose up -d

# Wait for the app container to be fully started
echo -e "${BLUE}Waiting for containers to start (this may take a few minutes)...${NC}"
sleep 30

# Initialize the database
echo -e "${BLUE}Initializing the database...${NC}"
docker-compose exec app npm run db:push

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "SimpleIT is now accessible at ${BLUE}http://localhost${NC} or ${BLUE}http://your-server-ip${NC}"
echo -e "Default login credentials:"
echo -e "  Username: ${BLUE}admin${NC}"
echo -e "  Password: ${BLUE}admin123${NC}"
echo
echo -e "${RED}IMPORTANT:${NC} Change your admin password immediately after first login!"
echo
echo -e "To view logs: ${BLUE}docker-compose logs -f${NC}"
echo -e "To stop the application: ${BLUE}docker-compose down${NC}"