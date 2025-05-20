#!/bin/bash

# SimpleIT Asset Management System Complete Deployment Script for Ubuntu
# Includes all fixes for WebSocket, 502 errors, and authentication issues

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
SESSION_SECRET=$(openssl rand -hex 32)

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

# FIX 1: Install PostgreSQL client dependencies
status_message "Installing PostgreSQL client for direct connections"
su - $APP_USER -c "cd $INSTALL_DIR && npm install pg @types/pg"

# Set up environment variables
status_message "Setting up environment variables"
cat > $INSTALL_DIR/.env << EOL
NODE_ENV=production
PORT=5000
USE_HTTPS=false
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
EOL
chown $APP_USER:$APP_USER $INSTALL_DIR/.env

# FIX 2: Create fixed database configuration with direct PostgreSQL connection
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

# FIX 3: Add trust proxy setting to Express
status_message "Setting trust proxy in Express for better proxy integration"
if [ -f "$INSTALL_DIR/server/index.ts" ]; then
  # Set trust proxy if not already set
  if ! grep -q "app.set('trust proxy'" "$INSTALL_DIR/server/index.ts"; then
    sed -i "/const app = express();/a app.set('trust proxy', 1);" "$INSTALL_DIR/server/index.ts"
  fi
  
  # Add static file serving if not already present
  if ! grep -q "express.static('public')" "$INSTALL_DIR/server/index.ts"; then
    sed -i "/app.use(express.json())/a app.use(express.static('public'));" "$INSTALL_DIR/server/index.ts"
  fi
fi

# FIX 4: Fix authentication settings
status_message "Updating authentication settings"
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  # Fix session configuration
  sed -i 's/resave: false/resave: true/g' "$INSTALL_DIR/server/routes.ts" 
  sed -i 's/saveUninitialized: false/saveUninitialized: true/g' "$INSTALL_DIR/server/routes.ts"
  sed -i 's/secure: process.env.NODE_ENV === "production"/secure: false/g' "$INSTALL_DIR/server/routes.ts"
  
  # Add sameSite: 'lax' to cookie settings if not present
  if ! grep -q "sameSite:" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '/maxAge:/a \        sameSite: "lax"' "$INSTALL_DIR/server/routes.ts"
  fi
fi

# FIX 5: Fix replitAuth if present
if [ -f "$INSTALL_DIR/server/replitAuth.ts" ]; then
  status_message "Updating authentication module settings"
  # Replace HTTPS URLs with HTTP
  sed -i 's|callbackURL: `https://${domain}/api/callback`|callbackURL: `http://${domain}/api/callback`|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|secure: process.env.NODE_ENV === "production"|secure: false, sameSite: "lax"|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|post_logout_redirect_uri: `${req.protocol}://${req.hostname}`|post_logout_redirect_uri: `http://${req.hostname}`|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|resave: false|resave: true|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|saveUninitialized: false|saveUninitialized: true|g' "$INSTALL_DIR/server/replitAuth.ts"
fi

# FIX 6: Create diagnostic test page
status_message "Creating diagnostic test page for authentication"
mkdir -p "$INSTALL_DIR/public"
cat > "$INSTALL_DIR/public/login-test.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SimpleIT Login Test</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; }
    button { padding: 8px 16px; margin-right: 10px; cursor: pointer; }
    .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>SimpleIT Login Test</h1>
  
  <div class="card">
    <h2>1. Login</h2>
    <p>Test login with admin/admin123:</p>
    <button onclick="testLogin()">Login as Admin</button>
    <h3>Result:</h3>
    <pre id="login-result">Click to test</pre>
  </div>
  
  <div class="card">
    <h2>2. Check Authentication</h2>
    <p>Verify that you are authenticated:</p>
    <button onclick="checkAuth()">Check Auth</button>
    <h3>Result:</h3>
    <pre id="auth-result">Click to test</pre>
  </div>
  
  <div class="card">
    <h2>3. Access Protected API</h2>
    <p>Try accessing a protected endpoint:</p>
    <button onclick="testProtectedApi()">Access /api/system-config</button>
    <h3>Result:</h3>
    <pre id="api-result">Click to test</pre>
  </div>
  
  <script>
    // Test login
    async function testLogin() {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' }),
          credentials: 'include'
        });
        
        const data = await response.json();
        document.getElementById('login-result').textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        document.getElementById('login-result').textContent = 'Error: ' + error.message;
      }
    }
    
    // Check authentication
    async function checkAuth() {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          document.getElementById('auth-result').textContent = JSON.stringify(data, null, 2);
        } else {
          document.getElementById('auth-result').textContent = 'Not authenticated';
        }
      } catch (error) {
        document.getElementById('auth-result').textContent = 'Error: ' + error.message;
      }
    }
    
    // Test protected API
    async function testProtectedApi() {
      try {
        const response = await fetch('/api/system-config', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          document.getElementById('api-result').textContent = 'Success! System config retrieved.';
        } else {
          document.getElementById('api-result').textContent = 'Failed to access protected API.';
        }
      } catch (error) {
        document.getElementById('api-result').textContent = 'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>
EOL
chown $APP_USER:$APP_USER "$INSTALL_DIR/public/login-test.html"

# Build the application
status_message "Building the application"
su - $APP_USER -c "cd $INSTALL_DIR && npm run build"

# Copy test page to the build directory
mkdir -p "$INSTALL_DIR/dist/public"
cp "$INSTALL_DIR/public/login-test.html" "$INSTALL_DIR/dist/public/"
chown -R $APP_USER:$APP_USER "$INSTALL_DIR/dist/public"

# FIX 7: Set up systemd service with fixed configuration
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
Environment=SESSION_SECRET=$SESSION_SECRET

# Load from .env file if it exists
EnvironmentFile=-$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOL

# FIX 8: Set up Nginx with proper proxy and cookie handling
status_message "Setting up Nginx with optimized configuration"
cat > /etc/nginx/sites-available/simpleit << EOL
server {
    listen 80;
    server_name _;

    # Enable large uploads (for CSV imports, etc.)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Cookie \$http_cookie;
        proxy_pass_header Set-Cookie;
        
        # Configure proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Disable buffering for better real-time updates
    proxy_buffering off;
    
    # Compression settings
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOL

ln -sf /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Run database migrations
status_message "Running database migrations"
su - $APP_USER -c "cd $INSTALL_DIR && NODE_ENV=production npm run db:push"

# Start and enable services
status_message "Starting and enabling services"
systemctl daemon-reload
systemctl enable --now simpleit
systemctl enable --now nginx

# Check service status
status_message "Checking service status"
systemctl status simpleit --no-pager

status_message "SimpleIT deployment complete!"
echo "✅ Fixed database WebSocket issues"
echo "✅ Fixed authentication session problems"
echo "✅ Fixed Nginx proxy configuration"
echo "✅ Fixed environment settings"
echo "✅ Created diagnostic test page"
echo ""
echo "You can access the application at http://your-server-ip"
echo "Default credentials: username 'admin', password 'admin123'"
echo ""
echo "To test authentication specifically, visit: http://your-server-ip/login-test.html"
echo ""
echo "To view logs: sudo journalctl -u simpleit -f"
echo "To restart: sudo systemctl restart simpleit"