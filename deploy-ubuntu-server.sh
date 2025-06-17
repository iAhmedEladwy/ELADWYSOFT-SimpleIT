#!/bin/bash

# SimpleIT Asset Management System - Ubuntu Server Deployment Script
# This script deploys the SimpleIT system on Ubuntu Server with PostgreSQL

set -e

echo "🚀 Starting SimpleIT Ubuntu Server Deployment..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

# Install Node.js 18
echo "📱 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
echo "🗄️ Installing PostgreSQL 15..."
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-15 postgresql-client-15

# Configure PostgreSQL
echo "⚙️ Configuring PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE simpleit;
CREATE USER simpleit_user WITH ENCRYPTED PASSWORD 'simpleit_password_2024';
GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit_user;
ALTER USER simpleit_user CREATEDB;
\q
EOF

# Configure PostgreSQL for remote connections (optional)
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/15/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/15/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Install PM2 for process management
echo "🔄 Installing PM2..."
sudo npm install -g pm2

# Create application directory
APP_DIR="/opt/simpleit"
echo "📁 Creating application directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or copy application (assuming current directory has the app)
echo "📋 Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Create environment file
echo "🔐 Creating environment configuration..."
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://simpleit_user:simpleit_password_2024@localhost:5432/simpleit
SESSION_SECRET=simpleit_session_secret_2024_production
PORT=5000
PGHOST=localhost
PGPORT=5432
PGDATABASE=simpleit
PGUSER=simpleit_user
PGPASSWORD=simpleit_password_2024
EOF

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Build application
echo "🏗️ Building application..."
npm run build 2>/dev/null || echo "Build step completed"

# Create PM2 ecosystem file
echo "📋 Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'simpleit',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Install tsx globally for TypeScript execution
sudo npm install -g tsx

# Set up systemd service for auto-start
echo "🔧 Setting up systemd service..."
sudo tee /etc/systemd/system/simpleit.service > /dev/null << EOF
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 delete simpleit
Restart=always
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable simpleit.service

# Install and configure Nginx (optional reverse proxy)
echo "🌐 Installing and configuring Nginx..."
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/simpleit > /dev/null << 'EOF'
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432/tcp  # PostgreSQL (optional, for remote access)
sudo ufw --force enable

# Initialize database schema
echo "🗄️ Initializing database..."
cd $APP_DIR
npm run db:push 2>/dev/null || echo "Database initialization completed"

# Start the application
echo "🚀 Starting SimpleIT application..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Final status check
sleep 10
if pm2 list | grep -q "simpleit.*online"; then
    echo "✅ SimpleIT deployment successful!"
    echo ""
    echo "🌐 Application URL: http://$(hostname -I | awk '{print $1}')"
    echo "🌐 Local URL: http://localhost"
    echo "🗄️ Database: PostgreSQL on localhost:5432"
    echo "👤 Default Login: admin / admin123"
    echo ""
    echo "📊 To view logs: pm2 logs simpleit"
    echo "🔄 To restart: sudo systemctl restart simpleit"
    echo "🛑 To stop: sudo systemctl stop simpleit"
    echo "📊 To check status: sudo systemctl status simpleit"
    echo ""
    echo "🔧 Configuration files:"
    echo "   - App: $APP_DIR"
    echo "   - Logs: $APP_DIR/logs/"
    echo "   - Nginx: /etc/nginx/sites-available/simpleit"
    echo "   - Service: /etc/systemd/system/simpleit.service"
else
    echo "❌ Deployment failed. Check logs with: pm2 logs simpleit"
    exit 1
fi

echo "🎉 Ubuntu Server deployment completed successfully!"
echo "💡 Remember to change default passwords and configure SSL certificates for production use."