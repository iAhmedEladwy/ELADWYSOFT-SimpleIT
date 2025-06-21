#!/bin/bash

# SimpleIT Asset Management System Enhanced Deployment Script
# Based on deploy-simpleit-complete.sh with improved error detection and fixes
# Version: 1.1.1

set -e  # Exit on any error

# Ensure the script is run as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"
APP_USER="simpleit"
DB_USER="simpleit"
DB_PASSWORD="simpleit"
DB_NAME="simpleit"
NODE_VERSION="22.15.1"
SESSION_SECRET=$(openssl rand -hex 32)
LOG_FILE="/var/log/simpleit-install.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Enhanced logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to display status messages with enhanced formatting
status_message() {
    log "\n${BLUE}==>${NC} ${GREEN}$1${NC}"
}

# Error handling function
error_exit() {
    log "${RED}❌ ERROR: $1${NC}"
    log "${YELLOW}Check the full log at: $LOG_FILE${NC}"
    exit 1
}

# Success message function
success_message() {
    log "${GREEN}✅ $1${NC}"
}

# Warning message function
warning_message() {
    log "${YELLOW}⚠️  $1${NC}"
}

# Check system requirements
check_requirements() {
    status_message "Checking system requirements"
    
    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        error_exit "This script is designed for Ubuntu systems only"
    fi
    
    # Check available disk space (at least 2GB)
    available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 2097152 ]; then
        error_exit "Insufficient disk space. At least 2GB required"
    fi
    
    # Check internet connectivity
    if ! ping -c 1 google.com &> /dev/null; then
        error_exit "No internet connection available"
    fi
    
    success_message "System requirements check passed"
}

# Initialize logging
initialize_logging() {
    echo "SimpleIT Deployment Started: $(date)" > "$LOG_FILE"
    log "${GREEN}🚀 Starting SimpleIT Enhanced Deployment${NC}"
    log "${BLUE}Log file: $LOG_FILE${NC}"
}

# Backup existing installation
backup_existing() {
    if [ -d "$INSTALL_DIR" ]; then
        status_message "Backing up existing installation"
        backup_dir="/opt/simpleit-backup-$(date +%Y%m%d-%H%M%S)"
        cp -r "$INSTALL_DIR" "$backup_dir" || error_exit "Failed to backup existing installation"
        success_message "Backup created at $backup_dir"
    fi
}

# Install system dependencies with enhanced error checking
install_dependencies() {
    status_message "Installing system dependencies"
    
    # Update package lists
    apt-get update || error_exit "Failed to update package lists"
    
    # Install required packages
    local packages=("curl" "wget" "gnupg2" "postgresql" "postgresql-contrib" "nginx" "ufw" "htop" "git")
    for package in "${packages[@]}"; do
        if ! dpkg -l | grep -q "^ii  $package "; then
            log "Installing $package..."
            apt-get install -y "$package" || error_exit "Failed to install $package"
        else
            log "$package is already installed"
        fi
    done
    
    success_message "System dependencies installed"
}

# Enhanced Node.js installation with version verification
install_nodejs() {
    status_message "Setting up Node.js v$NODE_VERSION (LTS)"
    
    # Remove any existing Node.js installations
    apt-get remove -y nodejs npm &>/dev/null || true
    
    # Add NodeSource repository
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg || error_exit "Failed to add NodeSource GPG key"
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    
    # Update and install Node.js
    apt-get update || error_exit "Failed to update package lists after adding NodeSource"
    apt-get install -y nodejs || error_exit "Failed to install Node.js"
    
    # Verify installation
    node_version=$(node -v)
    npm_version=$(npm -v)
    log "Installed Node.js $node_version and npm $npm_version"
    
    # Ensure we have the expected major version
    if [[ ! "$node_version" =~ ^v22\. ]]; then
        error_exit "Expected Node.js v22.x, but got $node_version"
    fi
    
    success_message "Node.js installation completed and verified"
}

# Enhanced PostgreSQL setup with improved error handling
setup_postgresql() {
    status_message "Setting up PostgreSQL database"
    
    # Start and enable PostgreSQL
    systemctl start postgresql || error_exit "Failed to start PostgreSQL"
    systemctl enable postgresql || error_exit "Failed to enable PostgreSQL"
    
    # Wait for PostgreSQL to be ready
    sleep 5
    
    # Create database user and database with proper error checking
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
    
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || error_exit "Failed to create database user"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || error_exit "Failed to create database"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || error_exit "Failed to grant database privileges"
    
    # Verify database connection
    if ! sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        error_exit "Database connection test failed"
    fi
    
    success_message "PostgreSQL setup completed and verified"
}

# Create application user with enhanced security
create_app_user() {
    status_message "Creating application user"
    
    if id "$APP_USER" &>/dev/null; then
        warning_message "User $APP_USER already exists"
    else
        useradd -r -s /bin/bash -d "$INSTALL_DIR" "$APP_USER" || error_exit "Failed to create user $APP_USER"
        success_message "Application user $APP_USER created"
    fi
}

# Enhanced application deployment with progress tracking
deploy_application() {
    status_message "Deploying SimpleIT application"
    
    # Create installation directory
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Clone or update repository (assuming local deployment)
    if [ -d ".git" ]; then
        warning_message "Git repository already exists, pulling latest changes"
        git pull origin main || warning_message "Failed to pull latest changes, continuing with existing code"
    else
        # If deploying from local files, copy them
        if [ -f "/home/*/simpleit/package.json" ]; then
            cp -r /home/*/simpleit/* . 2>/dev/null || true
        fi
        
        # Initialize git if package.json exists
        if [ -f "package.json" ]; then
            git init . &>/dev/null || true
        fi
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        error_exit "package.json not found. Please ensure SimpleIT source code is available"
    fi
    
    # Install dependencies with retry mechanism
    local retry_count=0
    local max_retries=3
    
    while [ $retry_count -lt $max_retries ]; do
        log "Installing npm dependencies (attempt $((retry_count + 1))/$max_retries)..."
        if npm ci --production; then
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -eq $max_retries ]; then
                error_exit "Failed to install npm dependencies after $max_retries attempts"
            fi
            warning_message "npm install failed, retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    # Build the application
    if npm run build 2>/dev/null; then
        success_message "Application build completed"
    else
        warning_message "Build script not found or failed, continuing..."
    fi
    
    # Set proper ownership
    chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR" || error_exit "Failed to set ownership"
    
    success_message "Application deployment completed"
}

# Enhanced environment configuration
setup_environment() {
    status_message "Setting up environment configuration"
    
    # Create environment file
    cat > "$INSTALL_DIR/.env" << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
EOF
    
    # Secure the environment file
    chmod 600 "$INSTALL_DIR/.env"
    chown "$APP_USER:$APP_USER" "$INSTALL_DIR/.env"
    
    success_message "Environment configuration completed"
}

# Enhanced systemd service with better error handling
setup_systemd_service() {
    status_message "Setting up systemd service"
    
    cat > /etc/systemd/system/simpleit.service << EOF
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$INSTALL_DIR
Environment=NODE_ENV=production
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=simpleit

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$INSTALL_DIR

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload || error_exit "Failed to reload systemd"
    systemctl enable simpleit || error_exit "Failed to enable SimpleIT service"
    
    success_message "Systemd service configured"
}

# Enhanced Nginx configuration with security headers
setup_nginx() {
    status_message "Setting up Nginx reverse proxy"
    
    # Backup default nginx config
    if [ -f /etc/nginx/sites-enabled/default ]; then
        mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
    fi
    
    cat > /etc/nginx/sites-available/simpleit << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    if ! nginx -t; then
        error_exit "Nginx configuration test failed"
    fi
    
    # Start and enable nginx
    systemctl start nginx || error_exit "Failed to start Nginx"
    systemctl enable nginx || error_exit "Failed to enable Nginx"
    
    success_message "Nginx configuration completed"
}

# Enhanced firewall setup
setup_firewall() {
    status_message "Setting up firewall"
    
    # Reset ufw to defaults
    ufw --force reset >/dev/null 2>&1
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful not to lock yourself out)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    success_message "Firewall configured"
}

# Start services with dependency checking
start_services() {
    status_message "Starting services"
    
    # Start PostgreSQL first
    systemctl restart postgresql || error_exit "Failed to start PostgreSQL"
    
    # Wait for PostgreSQL to be ready
    sleep 5
    
    # Start SimpleIT application
    systemctl start simpleit || error_exit "Failed to start SimpleIT service"
    
    # Wait for application to start
    sleep 10
    
    # Check if services are running
    if ! systemctl is-active --quiet postgresql; then
        error_exit "PostgreSQL is not running"
    fi
    
    if ! systemctl is-active --quiet simpleit; then
        error_exit "SimpleIT service is not running"
    fi
    
    if ! systemctl is-active --quiet nginx; then
        error_exit "Nginx is not running"
    fi
    
    success_message "All services started successfully"
}

# Enhanced service verification
verify_deployment() {
    status_message "Verifying deployment"
    
    # Check if application is responding
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            success_message "Application is responding on port 3000"
            break
        else
            if [ $attempt -eq $max_attempts ]; then
                error_exit "Application is not responding after $max_attempts attempts"
            fi
            log "Waiting for application to start (attempt $attempt/$max_attempts)..."
            sleep 5
            attempt=$((attempt + 1))
        fi
    done
    
    # Check nginx proxy
    if curl -f http://localhost >/dev/null 2>&1; then
        success_message "Nginx proxy is working"
    else
        error_exit "Nginx proxy is not working"
    fi
    
    # Check database connection
    if sudo -u "$APP_USER" psql "postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        success_message "Database connection verified"
    else
        error_exit "Database connection failed"
    fi
    
    success_message "Deployment verification completed"
}

# Display deployment summary
show_summary() {
    log "\n${GREEN}🎉 SimpleIT Deployment Completed Successfully!${NC}\n"
    log "${BLUE}📋 Deployment Summary:${NC}"
    log "   • Application Directory: $INSTALL_DIR"
    log "   • Application User: $APP_USER"
    log "   • Database: PostgreSQL ($DB_NAME)"
    log "   • Web Server: Nginx (port 80)"
    log "   • Application: Node.js (port 3000)"
    log "   • Log File: $LOG_FILE"
    log ""
    log "${BLUE}🌐 Access Information:${NC}"
    log "   • Web Interface: http://$(hostname -I | awk '{print $1}')"
    log "   • Default Login: admin / admin123"
    log ""
    log "${BLUE}🛠️  Service Management:${NC}"
    log "   • Start:   sudo systemctl start simpleit"
    log "   • Stop:    sudo systemctl stop simpleit"
    log "   • Restart: sudo systemctl restart simpleit"
    log "   • Status:  sudo systemctl status simpleit"
    log "   • Logs:    sudo journalctl -u simpleit -f"
    log ""
    log "${YELLOW}📝 Next Steps:${NC}"
    log "   1. Access the web interface using the URL above"
    log "   2. Login with the default credentials"
    log "   3. Change the default password immediately"
    log "   4. Configure your organization settings"
    log "   5. Set up SSL certificate for production use"
    log ""
    log "${GREEN}✅ Deployment completed successfully!${NC}"
}

# Main deployment function
main() {
    initialize_logging
    check_requirements
    backup_existing
    install_dependencies
    install_nodejs
    setup_postgresql
    create_app_user
    deploy_application
    setup_environment
    setup_systemd_service
    setup_nginx
    setup_firewall
    start_services
    verify_deployment
    show_summary
}

# Run main function with error handling
if main; then
    exit 0
else
    error_exit "Deployment failed. Check logs for details."
fi