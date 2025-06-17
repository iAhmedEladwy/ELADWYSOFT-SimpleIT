#!/bin/bash

# SimpleIT Asset Management System - Ubuntu PostgreSQL Deployment Script
# For deployment on private Ubuntu server with PostgreSQL database

set -e

echo "🚀 Starting SimpleIT deployment on Ubuntu with PostgreSQL..."

# System Updates
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install build essentials
echo "📦 Installing build tools..."
sudo apt-get install -y build-essential python3-dev

# PostgreSQL Configuration
echo "🔧 Configuring PostgreSQL..."

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE simpleit_db;
CREATE USER simpleit_user WITH ENCRYPTED PASSWORD 'SimpleIT2024!';
GRANT ALL PRIVILEGES ON DATABASE simpleit_db TO simpleit_user;
ALTER USER simpleit_user CREATEDB;
\q
EOF

# Configure PostgreSQL for connections
echo "🔧 Updating PostgreSQL configuration..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
echo "host    simpleit_db     simpleit_user   127.0.0.1/32    md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# Application Setup
echo "📁 Setting up application directory..."
APP_DIR="/opt/simpleit"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files (assuming running from project directory)
echo "📋 Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
echo "📦 Installing application dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build 2>/dev/null || echo "No build script found, continuing..."

# Environment Configuration
echo "⚙️ Setting up environment variables..."
cat > $APP_DIR/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://simpleit_user:SimpleIT2024!@localhost:5432/simpleit_db

# Email Configuration (Update with your SMTP settings)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Settings
APP_URL=http://your-server-ip:3000
SESSION_SECRET=$(openssl rand -base64 32)

# Security Settings
USE_HTTPS=false
EOF

echo "📝 Please update the email settings in $APP_DIR/.env with your SMTP configuration"

# Database Schema Setup
echo "🗄️ Setting up database schema..."
export DATABASE_URL="postgresql://simpleit_user:SimpleIT2024!@localhost:5432/simpleit_db"
npm run db:push || echo "Schema setup will be handled by application on first run"

# PM2 Configuration
echo "🚀 Setting up PM2 process manager..."
cat > $APP_DIR/ecosystem.config.js << EOF
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
      PORT: 3000
    },
    error_file: '/var/log/simpleit/error.log',
    out_file: '/var/log/simpleit/access.log',
    log_file: '/var/log/simpleit/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/simpleit
sudo chown $USER:$USER /var/log/simpleit

# Install tsx for TypeScript execution
npm install -g tsx

# Start application with PM2
echo "🚀 Starting SimpleIT application..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Firewall Configuration
echo "🔥 Configuring firewall..."
sudo ufw allow 3000/tcp
sudo ufw allow ssh
sudo ufw --force enable

# Nginx Setup (Optional reverse proxy)
echo "🌐 Installing Nginx reverse proxy..."
sudo apt-get install -y nginx

cat > /tmp/simpleit-nginx << EOF
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo mv /tmp/simpleit-nginx /etc/nginx/sites-available/simpleit
sudo ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# System Service Setup
echo "🔧 Creating systemd service..."
cat > /tmp/simpleit.service << EOF
[Unit]
Description=SimpleIT Asset Management System
After=network.target postgresql.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/simpleit.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable simpleit

# SSL/TLS Setup with Let's Encrypt (Optional)
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "
📊 Deployment Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ System Components Installed:
   • Node.js 20
   • PostgreSQL 15+
   • PM2 Process Manager
   • Nginx Reverse Proxy
   • Certbot for SSL

✅ Database Configuration:
   • Database: simpleit_db
   • User: simpleit_user
   • Connection: localhost:5432

✅ Application Setup:
   • Location: $APP_DIR
   • Port: 3000 (behind Nginx on port 80)
   • Process Manager: PM2
   • Logs: /var/log/simpleit/

🔧 Next Steps:
1. Update email settings in $APP_DIR/.env
2. Replace 'your-domain.com' in Nginx config with your actual domain
3. Set up SSL: sudo certbot --nginx -d your-domain.com
4. Access your application: http://your-server-ip
5. Login with: admin / admin123

📝 Important Commands:
   • View logs: pm2 logs simpleit
   • Restart app: pm2 restart simpleit
   • Check status: pm2 status
   • Monitor: pm2 monit
   • Database: sudo -u postgres psql simpleit_db

🛡️ Security Notes:
   • Change default admin password immediately
   • Configure proper email settings for password reset
   • Set up SSL certificate for production use
   • Review firewall rules and close unnecessary ports
   • Regular database backups recommended

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 SimpleIT deployment completed successfully!
Visit http://your-server-ip to access the application.
"

echo "🚀 Deployment completed! Check the summary above for next steps."