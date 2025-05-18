#!/bin/bash

# SimpleIT Universal Deployment Script
# This script supports multiple Linux distributions including:
# - Ubuntu/Debian
# - CentOS/RHEL/Fedora
# - Arch Linux
# Usage: sudo bash deploy-universal.sh

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

# Application settings
APP_PORT=3000
DB_NAME="simpleit"
DB_USER="simpleit"
DB_PASS="simpleit"
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

# Start logging
rm -f $LOG_FILE
log "Starting installation"

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    SimpleIT Asset Management System         ${NC}"
echo -e "${BLUE}        Universal Deployment Script          ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Detect Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$ID
    VERSION_ID=$VERSION_ID
    log "Detected distribution: $DISTRO $VERSION_ID"
elif type lsb_release >/dev/null 2>&1; then
    DISTRO=$(lsb_release -si)
    VERSION_ID=$(lsb_release -sr)
    log "Detected distribution (lsb_release): $DISTRO $VERSION_ID"
else
    error "Cannot detect Linux distribution"
fi

# Install system dependencies based on distribution
log "Installing system dependencies..."
case $DISTRO in
    ubuntu|debian)
        apt-get update -y >> $LOG_FILE 2>&1 || error "Failed to update package lists"
        apt-get install -y curl git postgresql postgresql-contrib build-essential >> $LOG_FILE 2>&1 || error "Failed to install dependencies"
        ;;
    centos|rhel|fedora|rocky|almalinux)
        if command -v dnf >/dev/null 2>&1; then
            dnf -y update >> $LOG_FILE 2>&1 || warning "Failed to update package lists"
            dnf -y install curl git postgresql postgresql-server postgresql-contrib gcc gcc-c++ make >> $LOG_FILE 2>&1 || error "Failed to install dependencies"
            # Initialize PostgreSQL database if not initialized
            if [ ! -f /var/lib/pgsql/data/pg_hba.conf ]; then
                postgresql-setup --initdb >> $LOG_FILE 2>&1 || warning "Failed to initialize PostgreSQL"
            fi
        else
            yum -y update >> $LOG_FILE 2>&1 || warning "Failed to update package lists"
            yum -y install curl git postgresql postgresql-server postgresql-contrib gcc gcc-c++ make >> $LOG_FILE 2>&1 || error "Failed to install dependencies"
            # Initialize PostgreSQL database if not initialized
            if [ ! -f /var/lib/pgsql/data/pg_hba.conf ]; then
                postgresql-setup initdb >> $LOG_FILE 2>&1 || warning "Failed to initialize PostgreSQL"
            fi
        fi
        systemctl enable postgresql >> $LOG_FILE 2>&1 || warning "Failed to enable PostgreSQL"
        systemctl start postgresql >> $LOG_FILE 2>&1 || error "Failed to start PostgreSQL"
        ;;
    arch|manjaro)
        pacman -Syu --noconfirm >> $LOG_FILE 2>&1 || warning "Failed to update package lists"
        pacman -S --noconfirm curl git postgresql base-devel >> $LOG_FILE 2>&1 || error "Failed to install dependencies"
        # Initialize PostgreSQL if needed
        if [ ! -d /var/lib/postgres/data ]; then
            su - postgres -c "initdb -D /var/lib/postgres/data" >> $LOG_FILE 2>&1 || warning "Failed to initialize PostgreSQL"
        fi
        systemctl enable postgresql >> $LOG_FILE 2>&1 || warning "Failed to enable PostgreSQL"
        systemctl start postgresql >> $LOG_FILE 2>&1 || error "Failed to start PostgreSQL"
        ;;
    *)
        warning "Unsupported distribution: $DISTRO. Trying to install generic dependencies."
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update -y && apt-get install -y curl git postgresql postgresql-contrib build-essential >> $LOG_FILE 2>&1
        elif command -v dnf >/dev/null 2>&1; then
            dnf -y install curl git postgresql postgresql-server gcc gcc-c++ make >> $LOG_FILE 2>&1
        elif command -v yum >/dev/null 2>&1; then
            yum -y install curl git postgresql postgresql-server gcc gcc-c++ make >> $LOG_FILE 2>&1
        elif command -v pacman >/dev/null 2>&1; then
            pacman -S --noconfirm curl git postgresql base-devel >> $LOG_FILE 2>&1
        else
            error "No suitable package manager found. Please install dependencies manually."
        fi
        ;;
esac

# Install Node.js
log "Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    case $DISTRO in
        ubuntu|debian)
            curl -o- https://fnm.vercel.app/install | bash - >> $LOG_FILE 2>&1 || error "Failed to set up Node.js repository"
           fnm install 22 >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
            ;;
        centos|rhel|fedora|rocky|almalinux)
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash - >> $LOG_FILE 2>&1 || error "Failed to set up Node.js repository"
            if command -v dnf >/dev/null 2>&1; then
                dnf -y install nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
            else
                yum -y install nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
            fi
            ;;
        arch|manjaro)
            pacman -S --noconfirm nodejs npm >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
            ;;
        *)
            warning "Unsupported distribution for Node.js installation. Please install Node.js $NODE_VERSION manually."
            exit 1
            ;;
    esac
else
    current_node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$current_node_version" != "$NODE_VERSION" ]; then
        warning "Node.js version $current_node_version is installed, but version $NODE_VERSION is recommended."
        read -p "Continue with existing Node.js version? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            case $DISTRO in
                ubuntu|debian)
                    apt-get remove -y nodejs npm >> $LOG_FILE 2>&1
                    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >> $LOG_FILE 2>&1 || error "Failed to set up Node.js repository"
                    apt-get install -y nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
                    ;;
                centos|rhel|fedora|rocky|almalinux)
                    if command -v dnf >/dev/null 2>&1; then
                        dnf -y remove nodejs npm >> $LOG_FILE 2>&1
                    else
                        yum -y remove nodejs npm >> $LOG_FILE 2>&1
                    fi
                    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash - >> $LOG_FILE 2>&1 || error "Failed to set up Node.js repository"
                    if command -v dnf >/dev/null 2>&1; then
                        dnf -y install nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
                    else
                        yum -y install nodejs >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
                    fi
                    ;;
                arch|manjaro)
                    pacman -S --noconfirm nodejs npm >> $LOG_FILE 2>&1 || error "Failed to install Node.js"
                    ;;
                *)
                    warning "Unsupported distribution for Node.js installation. Please install Node.js $NODE_VERSION manually."
                    exit 1
                    ;;
            esac
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

# Configure PostgreSQL
log "Setting up PostgreSQL database..."
# Identify the PostgreSQL version and configure the authentication
case $DISTRO in
    ubuntu|debian)
        pg_user="postgres"
        ;;
    centos|rhel|fedora|rocky|almalinux)
        pg_user="postgres"
        ;;
    arch|manjaro)
        pg_user="postgres"
        ;;
    *)
        pg_user="postgres"
        ;;
esac

# Check if database exists
if sudo -u $pg_user psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log "Database '$DB_NAME' already exists."
else
    # Create PostgreSQL user and database
    sudo -u $pg_user psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" >> $LOG_FILE 2>&1 || error "Failed to create database user"
    sudo -u $pg_user psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" >> $LOG_FILE 2>&1 || error "Failed to create database"
    sudo -u $pg_user psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" >> $LOG_FILE 2>&1 || error "Failed to grant privileges"
    
    log "Created PostgreSQL database '$DB_NAME'"
fi

# Create installation directory
log "Setting up installation directory..."
mkdir -p $INSTALL_DIR || error "Failed to create installation directory"

# Clone repository or download release
log "Downloading SimpleIT source code..."
if [ -d "$INSTALL_DIR/.git" ]; then
    cd $INSTALL_DIR
    git pull >> $LOG_FILE 2>&1 || error "Failed to update source code"
else
    # Check if directory is empty
    if [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR")" ]; then
        warning "Directory $INSTALL_DIR is not empty. Do you want to remove its contents?"
        read -p "Remove contents? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf $INSTALL_DIR/* $INSTALL_DIR/.* 2>/dev/null
        else
            error "Installation aborted. Please provide an empty directory."
        fi
    fi
    
    # Clone the repository (replace with your actual repository)
    git clone https://github.com/yourorganization/simpleit.git $INSTALL_DIR >> $LOG_FILE 2>&1 || {
        warning "Git clone failed. Do you want to download and extract the latest release instead?"
        read -p "Download release? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Downloading latest release..."
            # Note: Replace with your actual release URL
            curl -L -o /tmp/simpleit.tar.gz https://github.com/yourorganization/simpleit/archive/main.tar.gz >> $LOG_FILE 2>&1 || error "Failed to download release"
            
            tar -xzf /tmp/simpleit.tar.gz -C /tmp >> $LOG_FILE 2>&1 || error "Failed to extract release"
            cp -R /tmp/simpleit-main/* $INSTALL_DIR/ >> $LOG_FILE 2>&1 || error "Failed to copy files"
            rm -rf /tmp/simpleit.tar.gz /tmp/simpleit-main
        else
            error "Installation aborted."
        fi
    }
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
PORT=$APP_PORT

# Database configuration
DATABASE_URL=postgres://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME

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

# Create and configure systemd service
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
Environment=PORT=$APP_PORT

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

# Create Nginx configuration (optional)
create_nginx_config() {
    if command -v nginx >/dev/null 2>&1; then
        log "Creating Nginx configuration..."
        
        # Check if Nginx is installed
        if ! command -v nginx >/dev/null 2>&1; then
            case $DISTRO in
                ubuntu|debian)
                    apt-get install -y nginx >> $LOG_FILE 2>&1 || warning "Failed to install Nginx"
                    ;;
                centos|rhel|fedora|rocky|almalinux)
                    if command -v dnf >/dev/null 2>&1; then
                        dnf -y install nginx >> $LOG_FILE 2>&1 || warning "Failed to install Nginx"
                    else
                        yum -y install nginx >> $LOG_FILE 2>&1 || warning "Failed to install Nginx"
                    fi
                    ;;
                arch|manjaro)
                    pacman -S --noconfirm nginx >> $LOG_FILE 2>&1 || warning "Failed to install Nginx"
                    ;;
                *)
                    warning "Unsupported distribution for Nginx installation. Please install Nginx manually."
                    return
                    ;;
            esac
        fi
        
        # Create Nginx configuration
        cat > /etc/nginx/conf.d/simpleit.conf << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        
        # Test Nginx configuration
        nginx -t >> $LOG_FILE 2>&1 || {
            warning "Nginx configuration test failed. Please check the configuration manually."
            return
        }
        
        # Reload Nginx
        systemctl reload nginx >> $LOG_FILE 2>&1 || warning "Failed to reload Nginx"
        
        log "Nginx configuration created and service reloaded"
    else
        warning "Nginx is not installed. Skipping Nginx configuration."
    fi
}

# Ask for Nginx configuration
read -p "Do you want to create an Nginx configuration for SimpleIT? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    create_nginx_config
fi

# Display installation summary
ip_address=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}==============================================${NC}"
echo -e "${GREEN}    SimpleIT Installation Complete!          ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo ""
echo -e "Installation directory: ${BLUE}$INSTALL_DIR${NC}"
echo -e "Database name: ${BLUE}$DB_NAME${NC}"
echo -e "Database user: ${BLUE}$DB_USER${NC}"
echo -e "Application URL: ${BLUE}http://$ip_address:$APP_PORT${NC}"
echo ""
echo -e "To manage the service:"
echo -e "  ${YELLOW}sudo systemctl start|stop|restart|status simpleit${NC}"
echo ""
echo -e "To view logs:"
echo -e "  ${YELLOW}sudo journalctl -u simpleit -f${NC}"
echo ""
echo -e "Installation log: ${BLUE}$LOG_FILE${NC}"
echo ""
if command -v nginx >/dev/null 2>&1; then
    echo -e "Nginx configuration: ${BLUE}/etc/nginx/conf.d/simpleit.conf${NC}"
    echo -e "You can access SimpleIT at: ${BLUE}http://$ip_address/${NC}"
else
    echo -e "${YELLOW}IMPORTANT: For production use, configure a reverse proxy${NC}"
    echo -e "${YELLOW}           with HTTPS using Nginx or Apache.${NC}"
fi
echo ""
echo -e "${GREEN}Thank you for installing SimpleIT Asset Management!${NC}"
echo ""

exit 0
