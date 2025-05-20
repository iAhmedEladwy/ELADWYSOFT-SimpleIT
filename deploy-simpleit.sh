#!/bin/bash

# SimpleIT Asset Management System Deployment Script for Ubuntu
# This script includes all fixes for WebSocket and 502 errors

# Ensure the script is run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"
APP_USER="simpleit"
DB_USER="simpleit"
DB_PASSWORD="simpleit"
DB_NAME="simpleit"
NODE_VERSION="22.15.1"

# Function to display status messages
status_message() {
  echo -e "\n\033[1;34m==>\033[0m \033[1m$1\033[0m"
}

status_message "Starting SimpleIT deployment"

# Install required dependencies
status_message "Installing system dependencies"
apt-get update
apt-get install -y curl wget gnupg2 postgresql postgresql-contrib nginx

# Set up Node.js v22.x LTS
status_message "Setting up Node.js v$NODE_VERSION (LTS)"
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs

# Verify Node.js and npm versions
node_version=$(node -v)
npm_version=$(npm -v)
status_message "Installed Node.js $node_version and npm $npm_version"

# Set up PostgreSQL database
status_message "Setting up PostgreSQL database"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Create system user for the application
status_message "Creating system user for application"
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash $APP_USER
fi

# Create installation directory
status_message "Creating installation directory"
mkdir -p $INSTALL_DIR
chown $APP_USER:$APP_USER $INSTALL_DIR

# Download or copy the application
status_message "Downloading application files"
# Note: Replace with actual download command or copy from local files
# For this example, we'll assume the files are in /tmp/simpleit-source
if [ -d "/tmp/simpleit-source" ]; then
  cp -R /tmp/simpleit-source/* $INSTALL_DIR/
  chown -R $APP_USER:$APP_USER $INSTALL_DIR
else
  echo "Please place the SimpleIT source code in /tmp/simpleit-source or modify this script"
  exit 1
fi

# Install dependencies
status_message "Installing application dependencies"
cd $INSTALL_DIR
su - $APP_USER -c "cd $INSTALL_DIR && npm install"
su - $APP_USER -c "cd $INSTALL_DIR && npm install pg @types/pg"

# Set up environment variables
status_message "Setting up environment variables"
cat > $INSTALL_DIR/.env << EOL
NODE_ENV=production
PORT=5000
USE_HTTPS=false
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$(openssl rand -hex 32)
REPLIT_DOMAINS=localhost
ISSUER_URL=http://localhost:5000
REPL_ID=simpleit-production
EOL
chown $APP_USER:$APP_USER $INSTALL_DIR/.env

# Create fixed database configuration with direct PostgreSQL connection
status_message "Creating fixed database configuration with direct PostgreSQL connection"
cat > "$INSTALL_DIR/server/db.ts" << EOL
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for database connection string
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create direct PostgreSQL connection (no WebSocket)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Create Drizzle instance
const db = drizzle(pool, { schema });

export { pool, db };
EOL
chown $APP_USER:$APP_USER "$INSTALL_DIR/server/db.ts"

# Fix authentication settings if present
status_message "Updating authentication settings"
if [ -f "$INSTALL_DIR/server/replitAuth.ts" ]; then
  # Replace HTTPS URLs with HTTP in the file
  sed -i 's|callbackURL: `https://${domain}/api/callback`|callbackURL: `http://${domain}/api/callback`|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|secure: process.env.NODE_ENV === "production"|secure: false|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|post_logout_redirect_uri: `${req.protocol}://${req.hostname}`|post_logout_redirect_uri: `http://${req.hostname}`|g' "$INSTALL_DIR/server/replitAuth.ts"
  chown $APP_USER:$APP_USER "$INSTALL_DIR/server/replitAuth.ts"
fi

# Build the application
status_message "Building the application"
su - $APP_USER -c "cd $INSTALL_DIR && npm run build"

# Set up systemd service
status_message "Setting up systemd service"
cat > /etc/systemd/system/simpleit.service << EOL
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
Restart=on-failure

# Essential environment variables
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=USE_HTTPS=false
Environment=DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
Environment=SESSION_SECRET=$(openssl rand -hex 32)
Environment=REPLIT_DOMAINS=localhost
Environment=ISSUER_URL=http://localhost:5000
Environment=REPL_ID=simpleit-production

# Load from .env file if it exists
EnvironmentFile=-$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOL

# Set up Nginx
status_message "Setting up Nginx"
cat > /etc/nginx/sites-available/simpleit << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Configure proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOL

ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Run database migrations
status_message "Running database migrations"
su - $APP_USER -c "cd $INSTALL_DIR && npm run db:push"

# Start and enable services
status_message "Starting and enabling services"
systemctl daemon-reload
systemctl enable --now simpleit
systemctl enable --now nginx

# Check service status
status_message "Checking service status"
systemctl status simpleit --no-pager

status_message "SimpleIT deployment complete!"
echo "You can access the application at http://your-server-ip"
echo "Default credentials: username 'admin', password 'admin123'"
echo ""
echo "To view logs: sudo journalctl -u simpleit -f"
echo "To restart: sudo systemctl restart simpleit"