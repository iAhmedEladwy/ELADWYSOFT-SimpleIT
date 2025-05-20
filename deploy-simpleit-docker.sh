#!/bin/bash

# SimpleIT Docker Deployment Script
# This script automates the deployment of SimpleIT using Docker and Docker Compose

# Text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}SimpleIT Docker Deployment Script${NC}"
echo "----------------------------------------"

# Generate secure passwords for database and session
DB_PASSWORD=$(openssl rand -base64 16)
SESSION_SECRET=$(openssl rand -base64 32)

# Save credentials to a file (for reference)
echo "DB_PASSWORD=${DB_PASSWORD}" > .env
echo "SESSION_SECRET=${SESSION_SECRET}" >> .env
chmod 600 .env

echo -e "${BLUE}Generated secure credentials and saved to .env file${NC}"

# Ensure docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    if [ -f "docs/docker-compose.yml" ]; then
        cp docs/docker-compose.yml ./docker-compose.yml
        echo -e "${BLUE}Copied docker-compose.yml from docs folder${NC}"
    else
        echo -e "${RED}docker-compose.yml not found. Please ensure it exists in the docs folder.${NC}"
        exit 1
    fi
fi

# Ensure Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    if [ -f "docs/Dockerfile" ]; then
        cp docs/Dockerfile ./Dockerfile
        echo -e "${BLUE}Copied Dockerfile from docs folder${NC}"
    else
        echo -e "${RED}Dockerfile not found. Please ensure it exists in the docs folder.${NC}"
        exit 1
    fi
fi

# Create nginx directory if it doesn't exist
if [ ! -d "nginx" ]; then
    mkdir -p nginx
    echo -e "${BLUE}Created nginx directory${NC}"
fi

# Ensure nginx config exists
if [ ! -f "nginx/default.conf" ]; then
    if [ -f "docs/nginx/default.conf" ]; then
        cp docs/nginx/default.conf ./nginx/default.conf
        echo -e "${BLUE}Copied nginx config from docs folder${NC}"
    else
        echo -e "${YELLOW}Nginx config not found. Using a basic configuration.${NC}"
        cat > nginx/default.conf << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL
    fi
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir -p uploads
    echo -e "${BLUE}Created uploads directory${NC}"
fi

# Start containers
echo -e "${BLUE}Starting Docker containers...${NC}"
docker-compose down
docker-compose up -d

# Wait for containers to initialize
echo -e "${BLUE}Waiting for containers to initialize (30 seconds)...${NC}"
sleep 30

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
docker-compose exec -T app npm run db:push

# Display completion message
echo -e "${GREEN}SimpleIT deployment completed!${NC}"
echo -e "${BLUE}You can access the application at:${NC} http://localhost"
echo -e "${BLUE}Default login credentials:${NC}"
echo -e "  Username: ${YELLOW}admin${NC}"
echo -e "  Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC} For security, please change the default admin password after first login."
echo -e "For more information, refer to the deployment guide at docs/SimpleIT_Deployment_Guide.md"