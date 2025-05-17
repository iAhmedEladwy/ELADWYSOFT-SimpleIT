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
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}SimpleIT Docker Deployment Script${NC}"
echo "----------------------------------------"

echo -e "${BLUE}Checking for required dependencies...${NC}"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Git is not installed. Please install Git first.${NC}"
    echo -e "For Ubuntu/Debian: ${YELLOW}sudo apt-get update && sudo apt-get install -y git${NC}"
    echo -e "For CentOS/RHEL: ${YELLOW}sudo yum install -y git${NC}"
    echo -e "For macOS: ${YELLOW}brew install git${NC}"
    echo -e "Or visit https://git-scm.com/downloads for installation instructions."
    exit 1
fi
echo -e "✓ ${GREEN}Git is installed${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    echo -e "For Ubuntu/Debian: ${YELLOW}curl -fsSL https://get.docker.com | sh${NC}"
    echo -e "For macOS: Install Docker Desktop from https://docs.docker.com/desktop/install/mac-install/"
    echo -e "Or visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi
echo -e "✓ ${GREEN}Docker is installed${NC}"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is installed but not running. Please start Docker first.${NC}"
    echo -e "On Linux: ${YELLOW}sudo systemctl start docker${NC}"
    echo -e "On macOS: Start Docker Desktop application"
    exit 1
fi
echo -e "✓ ${GREEN}Docker is running${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    echo -e "For Ubuntu/Debian: ${YELLOW}sudo apt-get install -y docker-compose-plugin${NC}"
    echo -e "For macOS: Docker Compose is included with Docker Desktop"
    echo -e "Or visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi
echo -e "✓ ${GREEN}Docker Compose is installed${NC}"

# Check if curl is installed (needed for API testing)
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}Warning: curl is not installed. It's recommended for testing the API.${NC}"
    echo -e "For Ubuntu/Debian: ${YELLOW}sudo apt-get install -y curl${NC}"
    echo -e "For CentOS/RHEL: ${YELLOW}sudo yum install -y curl${NC}"
    echo -e "For macOS: ${YELLOW}brew install curl${NC}"
else
    echo -e "✓ ${GREEN}curl is installed${NC}"
fi

echo -e "${GREEN}All required dependencies are installed and ready!${NC}"
echo "----------------------------------------"

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