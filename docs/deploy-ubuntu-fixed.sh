#!/bin/bash

# SimpleIT Deployment Script for Ubuntu 22.04/24.04
# This script automates the deployment of the SimpleIT Asset Management System
# Usage: sudo bash deploy-ubuntu-fixed.sh

set -e

# Text styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Installation directory
INSTALL_DIR="/opt/simpleit"
LOG_FILE="/tmp/simpleit-install.log"

# System user to run the application
SYS_USER="simpleit"

# NodeJS version
NODE_VERSION="18"

# Functions
log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> $LOG_FILE
  exit 1
}

warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> $LOG_FILE
}

info() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> $LOG_FILE
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root. Try 'sudo bash $0'"
fi

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    SimpleIT Asset Management System         ${NC}"
echo -e "${BLUE}         Deployment Script                   ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Start logging
rm -f $LOG_FILE
log "Starting installation"

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
  error "This script is designed for Ubuntu. Please use the universal deployment script for other distributions."
fi

# Install dependencies
log "Installing dependencies..."
apt-get update || error "Failed to update package lists"

# Install essential tools
apt-get install -y curl wget git build-essential nginx unzip || error "Failed to install essential packages"

# Install Node.js
if ! command -v node &> /dev/null; then
  log "Installing Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - || error "Failed to set up Node.js repository"
  apt-get install -y nodejs || error "Failed to install Node.js"
  log "Node.js $(node -v) installed"
else
  log "Node.js $(node -v) already installed"
fi

# Install PostgreSQL
if ! command -v psql &> /dev/null; then
  log "Installing PostgreSQL..."
  apt-get install -y postgresql postgresql-contrib || error "Failed to install PostgreSQL"
  log "PostgreSQL installed"
else
  log "PostgreSQL already installed"
fi

# Create system user if it doesn't exist
if ! id -u "$SYS_USER" &>/dev/null; then
  log "Creating system user $SYS_USER..."
  useradd -m -s /bin/bash "$SYS_USER" || error "Failed to create system user"
  log "System user created"
else
  log "System user $SYS_USER already exists"
fi

# Create installation directory
if [ ! -d "$INSTALL_DIR" ]; then
  log "Creating installation directory at $INSTALL_DIR..."
  mkdir -p "$INSTALL_DIR" || error "Failed to create installation directory"
  log "Installation directory created"
else
  log "Installation directory already exists"
fi

# Set ownership
chown -R "$SYS_USER:$SYS_USER" "$INSTALL_DIR" || error "Failed to set directory ownership"

# Check if application files already exist
if [ -f "$INSTALL_DIR/package.json" ]; then
  log "Application files already exist in $INSTALL_DIR"
  
  # Ask for confirmation to overwrite
  read -p "Do you want to reinstall the application? This will overwrite any existing files. (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Keeping existing files and continuing with configuration..."
  else
    log "Removing existing application files..."
    rm -rf "$INSTALL_DIR"/* || error "Failed to remove existing files"
    log "Installing application files..."
    
    # Clone the application repository or copy files
    log "Copying application files to $INSTALL_DIR..."
    cp -r ./* "$INSTALL_DIR/" || error "Failed to copy application files"
  fi
else
  # Clone the application repository or copy files
  log "Copying application files to $INSTALL_DIR..."
  cp -r ./* "$INSTALL_DIR/" || error "Failed to copy application files"
fi

# Set ownership again after copying files
chown -R "$SYS_USER:$SYS_USER" "$INSTALL_DIR" || error "Failed to set directory ownership"

# Configure PostgreSQL
log "Configuring PostgreSQL..."
PG_VERSION=$(psql --version | grep -oP '(?<=psql \(PostgreSQL\) )[0-9]+' || echo "14")
PG_HBA_PATH="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

if [ -f "$PG_HBA_PATH" ]; then
  # Backup pg_hba.conf
  cp "$PG_HBA_PATH" "${PG_HBA_PATH}.bak" || warning "Failed to backup pg_hba.conf"
  
  # Add a user to PostgreSQL if not exists
  su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname = 'simpleit'\" | grep -q 1 || psql -c \"CREATE USER simpleit WITH PASSWORD 'simpleit'\"" || warning "Failed to create PostgreSQL user"
  
  # Create database if not exists
  su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname = 'simpleit'\" | grep -q 1 || psql -c \"CREATE DATABASE simpleit OWNER simpleit\"" || warning "Failed to create PostgreSQL database"
  
  # Grant privileges
  su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit\"" || warning "Failed to grant privileges"
  
  log "PostgreSQL database 'simpleit' configured"
  
  # Restart PostgreSQL to apply changes
  systemctl restart postgresql || warning "Failed to restart PostgreSQL"
else
  warning "PostgreSQL configuration file not found at $PG_HBA_PATH. Manual configuration may be required."
fi

# Create environment file with correct configuration
log "Creating environment file..."
cat > "$INSTALL_DIR/.env" << EOL
# Application Environment
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgres://simpleit:simpleit@localhost:5432/simpleit

# Session Configuration
SESSION_SECRET=$(openssl rand -hex 32)

# Application Settings
REPLIT_DOMAINS=$(hostname -f),localhost
ISSUER_URL=http://localhost:3000
REPL_ID=simpleit-production
EOL

# Set permissions
chmod 640 "$INSTALL_DIR/.env" || error "Failed to set environment file permissions"
chown "$SYS_USER:$SYS_USER" "$INSTALL_DIR/.env" || error "Failed to set environment file ownership"

# Install npm dependencies and build application
log "Installing npm dependencies and building application..."
cd "$INSTALL_DIR" || error "Failed to change to installation directory"

# Install dependencies as the system user
su - "$SYS_USER" -c "cd $INSTALL_DIR && npm install --omit=dev" || warning "Failed to install npm dependencies"

# Build the application
log "Building the application..."
su - "$SYS_USER" -c "cd $INSTALL_DIR && npm run build" || warning "Failed to build the application"

# Run database migrations
log "Running database migrations..."
su - "$SYS_USER" -c "cd $INSTALL_DIR && npm run db:push" || warning "Failed to run database migrations"

# Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/simpleit.service << EOL
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service

[Service]
Type=simple
User=$SYS_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/server/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd
systemctl daemon-reload || error "Failed to reload systemd"

# Enable and start the service
log "Starting SimpleIT service..."
systemctl enable simpleit || warning "Failed to enable SimpleIT service"
systemctl start simpleit || warning "Failed to start SimpleIT service"

# Check if service is running
if systemctl is-active --quiet simpleit; then
  log "SimpleIT service is running"
else
  warning "SimpleIT service failed to start. Check logs with 'journalctl -u simpleit'"
fi

# Configure Nginx
log "Configuring Nginx..."
cat > /etc/nginx/sites-available/simpleit << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

# Enable Nginx site
if [ -f /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default || warning "Failed to remove default Nginx site"
fi

ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/ || warning "Failed to enable Nginx site"

# Test Nginx configuration
nginx -t && systemctl restart nginx || warning "Failed to configure Nginx"

# Get server IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

# Installation completed
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}   SimpleIT Installation Completed!         ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo -e "${BLUE}Installation directory:${NC} $INSTALL_DIR"
echo -e "${BLUE}Application URL:${NC} http://$SERVER_IP"
echo -e "${BLUE}Default login:${NC} admin / admin123"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "1. For production use, configure HTTPS using Let's Encrypt:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "2. If you encounter any issues:"
echo "   - Check application logs: journalctl -u simpleit -f"
echo "   - Check Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
echo "3. To restart the service:"
echo "   sudo systemctl restart simpleit"
echo ""
echo "4. To monitor the service:"
echo "   sudo systemctl status simpleit"
echo ""
log "Installation completed successfully"