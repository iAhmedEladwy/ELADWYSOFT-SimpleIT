#!/bin/bash

# SimpleIT Quick Deploy Script for Ubuntu
# This is a simplified script to deploy SimpleIT on Ubuntu
set -e

echo "===== SimpleIT Quick Deployment Script ====="
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Install dependencies
echo "Installing dependencies..."
apt-get update
apt-get install -y curl wget git build-essential nginx unzip postgresql postgresql-contrib

# Install Node.js 22.x (LTS)
echo "Setting up Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Upgrade npm to latest version
echo "Upgrading NPM..."
npm install -g npm@latest
echo "Updated NPM version: $(npm -v)"

# Set installation directory
INSTALL_DIR="/opt/simpleit"
mkdir -p $INSTALL_DIR

# Create system user
if ! id -u "simpleit" &>/dev/null; then
  echo "Creating system user..."
  useradd -m -s /bin/bash simpleit
else
  echo "User 'simpleit' already exists."
fi

# Configure PostgreSQL
echo "Setting up PostgreSQL database..."
systemctl start postgresql
systemctl enable postgresql

su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname = 'simpleit'\" | grep -q 1 || psql -c \"CREATE USER simpleit WITH PASSWORD 'simpleit'\""
su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname = 'simpleit'\" | grep -q 1 || psql -c \"CREATE DATABASE simpleit OWNER simpleit\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit\""

# Copy application files
echo "Copying application files..."
cp -r ./* $INSTALL_DIR/
chown -R simpleit:simpleit $INSTALL_DIR

# Create environment file
echo "Creating environment configuration..."
cat > "$INSTALL_DIR/.env" << EOL
# Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgres://simpleit:simpleit@localhost:5432/simpleit

# Session Configuration
SESSION_SECRET=$(openssl rand -hex 32)

# Application Settings
REPLIT_DOMAINS=localhost
ISSUER_URL=http://localhost:5000
REPL_ID=simpleit-production
USE_HTTPS=false
EOL

chmod 640 "$INSTALL_DIR/.env"
chown simpleit:simpleit "$INSTALL_DIR/.env"

# Install dependencies and build application
echo "Installing dependencies and building application..."
cd $INSTALL_DIR
mkdir -p node_modules
chown -R simpleit:simpleit node_modules
chmod -R 755 node_modules

# Install all dependencies with proper permissions
su - simpleit -c "cd $INSTALL_DIR && npm install"

# Build the application
echo "Building the application..."
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Run database migrations
echo "Running database migrations..."
su - simpleit -c "cd $INSTALL_DIR && npx drizzle-kit push"

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/simpleit.service << EOL
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service

[Service]
Type=simple
User=simpleit
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/dist/index.js
Restart=on-failure

# Set environment variables directly in the service
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=USE_HTTPS=false
Environment=DATABASE_URL=postgres://simpleit:simpleit@localhost:5432/simpleit
Environment=SESSION_SECRET=$(openssl rand -hex 32)
Environment=REPLIT_DOMAINS=localhost
Environment=ISSUER_URL=http://localhost:5000
Environment=REPL_ID=simpleit-production

# Also load environment variables from file
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOL

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/simpleit << EOL
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
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

# Enable the site
ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
if [ -f /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default
fi

# Reload systemd and start services
systemctl daemon-reload
systemctl enable simpleit
systemctl start simpleit
systemctl restart nginx

# Get server IP address
SERVER_IP=$(hostname -I | awk '{print $1}')

# Installation completed
echo ""
echo "===== SimpleIT Installation Complete! ====="
echo ""
echo "Application URL: http://$SERVER_IP"
echo "Default login: admin / admin123"
echo ""
echo "If you encounter any issues:"
echo "- Check service status: sudo systemctl status simpleit"
echo "- View service logs: sudo journalctl -u simpleit -f"
echo "- Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "Enjoy your SimpleIT Asset Management System!"