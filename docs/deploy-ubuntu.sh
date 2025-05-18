#!/bin/bash

# SimpleIT Deployment Script for Ubuntu 22.04/24.04
# This script automates the deployment of the SimpleIT Asset Management System
# Usage: sudo bash deploy-ubuntu.sh

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
NODE_VERSION="22"

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
. /etc/os-release
log "Detected Ubuntu version: $VERSION_ID"

if [[ $VERSION_ID != "22.04" && $VERSION_ID != "24.04" ]]; then
  warning "This script is optimized for Ubuntu 22.04 and 24.04. You are using $VERSION_ID."
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Installation aborted."
  fi
fi

# Update system
log "Updating system package lists..."
apt-get update -y >> $LOG_FILE 2>&1 || error "Failed to update package lists"

# Install required packages
log "Installing required system dependencies..."
apt-get install -y curl git postgresql postgresql-contrib build-essential >> $LOG_FILE 2>&1 || error "Failed to install dependencies"

# Install Node.js
log "Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >> $LOG_FILE 2>&1 || error "Failed to set up Node.js repository"
  apt-get install -y nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
else
  current_node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$current_node_version" != "$NODE_VERSION" ]; then
    warning "Node.js version $current_node_version is installed, but version $NODE_VERSION is recommended."
    read -p "Continue with existing Node.js version? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      apt-get remove -y nodejs npm >> $LOG_FILE 2>&1
      curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >> $LOG_FILE 2>&1 || error "Failed to set up Node.js repository"
      apt-get install -y nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
    fi
  else
    log "Node.js $NODE_VERSION is already installed."
  fi
fi

# Create system user
log "Creating system user '$SYS_USER'..."
if ! id "$SYS_USER" &>/dev/null; then
  useradd -m -r -s /bin/bash $SYS_USER >> $LOG_FILE 2>&1 || error "Failed to create system user"
else
  log "System user '$SYS_USER' already exists."
fi

# Set up PostgreSQL
log "Setting up PostgreSQL database..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "simpleit"; then
  log "Database 'simpleit' already exists."
else
  # Create PostgreSQL user and database
  sudo -u postgres psql -c "CREATE USER simpleit WITH PASSWORD 'simpleit';" >> $LOG_FILE 2>&1 || error "Failed to create database user"
  sudo -u postgres psql -c "CREATE DATABASE simpleit OWNER simpleit;" >> $LOG_FILE 2>&1 || error "Failed to create database"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit;" >> $LOG_FILE 2>&1 || error "Failed to grant privileges"
  
  log "Created PostgreSQL database 'simpleit'"
fi

# Create installation directory
log "Setting up installation directory..."
mkdir -p $INSTALL_DIR || error "Failed to create installation directory"

# Setup application directory
log "Setting up application directory..."

# Check if directory is not empty
if [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR")" ]; then
  log "Using existing files in $INSTALL_DIR"
else
  log "Installation directory is empty. Please copy the SimpleIT files to $INSTALL_DIR before running this script."
  log "You can run: cp -R /path/to/simpleit/* $INSTALL_DIR/"
  error "No application files found in $INSTALL_DIR. Installation aborted."
fi

# Set permissions
log "Setting permissions..."
chown -R $SYS_USER:$SYS_USER $INSTALL_DIR >> $LOG_FILE 2>&1 || error "Failed to set permissions"
chmod -R 750 $INSTALL_DIR >> $LOG_FILE 2>&1 || error "Failed to set permissions"

# Create .env file
log "Creating environment configuration..."
cat > $INSTALL_DIR/.env << EOF
# SimpleIT Environment Configuration
NODE_ENV=production
PORT=3000

# Database configuration
DATABASE_URL=postgres://simpleit:simpleit@localhost:5432/simpleit

# Session configuration (generate a random string)
SESSION_SECRET=$(openssl rand -hex 32)

# Application settings
ASSET_ID_PREFIX=SIT-
EMP_ID_PREFIX=EMP-
TICKET_ID_PREFIX=TKT-
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=English
EOF

chown $SYS_USER:$SYS_USER $INSTALL_DIR/.env
chmod 640 $INSTALL_DIR/.env

# Install dependencies and build
log "Installing Node.js dependencies..."
cd $INSTALL_DIR
sudo -u $SYS_USER npm install --production >> $LOG_FILE 2>&1 || error "Failed to install dependencies"

log "Building application..."
sudo -u $SYS_USER npm run build >> $LOG_FILE 2>&1 || error "Failed to build application"

# Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/simpleit.service << EOF
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service

[Service]
Type=simple
User=$SYS_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/dist/server/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Setup database schema
log "Setting up database schema..."
cd $INSTALL_DIR
sudo -u $SYS_USER npm run db:push >> $LOG_FILE 2>&1 || error "Failed to setup database schema"

# Enable and start service
log "Starting SimpleIT service..."
systemctl daemon-reload >> $LOG_FILE 2>&1 || error "Failed to reload systemd configuration"
systemctl enable simpleit.service >> $LOG_FILE 2>&1 || error "Failed to enable service"
systemctl start simpleit.service >> $LOG_FILE 2>&1 || warning "Failed to start service"

# Check if the service is running
if systemctl is-active --quiet simpleit.service; then
  log "SimpleIT service is running"
else
  warning "SimpleIT service is not running. Check logs with 'journalctl -u simpleit.service'"
fi

# Display installation summary
ip_address=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}    SimpleIT Installation Complete!          ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo -e "Installation directory: ${BLUE}$INSTALL_DIR${NC}"
echo -e "Database name: ${BLUE}simpleit${NC}"
echo -e "Database user: ${BLUE}simpleit${NC}"
echo -e "Application URL: ${BLUE}http://$ip_address:3000${NC}"
echo ""
echo -e "To manage the service:"
echo -e "  ${YELLOW}sudo systemctl start|stop|restart|status simpleit${NC}"
echo ""
echo -e "To view logs:"
echo -e "  ${YELLOW}sudo journalctl -u simpleit -f${NC}"
echo ""
echo -e "Installation log: ${BLUE}$LOG_FILE${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: For production use, configure a reverse proxy${NC}"
echo -e "${YELLOW}           with HTTPS using Nginx or Apache.${NC}"
echo ""
echo -e "${GREEN}Thank you for installing SimpleIT Asset Management!${NC}"
echo ""

exit 0