#!/bin/bash

# Clean solution for SimpleIT installation on Ubuntu
# Created based on fixing authentication errors and deployment issues

# Check if running as root
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
SESSION_SECRET=$(openssl rand -hex 32)

echo "Applying SimpleIT clean fix..."

# Fix 1: Create modified database connection (direct PostgreSQL)
cat > "$INSTALL_DIR/server/db.ts" << EOL
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Create direct PostgreSQL connection (no WebSocket)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Create Drizzle instance
const db = drizzle(pool, { schema });

export { pool, db };
EOL

# Fix 2: Update session configuration in routes.ts for correct settings
sed -i "s/resave: false/resave: true/g" "$INSTALL_DIR/server/routes.ts"
sed -i "s/saveUninitialized: false/saveUninitialized: true/g" "$INSTALL_DIR/server/routes.ts"
sed -i "s/secure: process.env.NODE_ENV === \"production\"/secure: false/g" "$INSTALL_DIR/server/routes.ts"

# Fix 3: Add cookie default parameters in the index.ts if not already present
if [ -f "$INSTALL_DIR/server/index.ts" ]; then
  # Set trust proxy
  if ! grep -q "app.set('trust proxy'" "$INSTALL_DIR/server/index.ts"; then
    sed -i "/const app = express();/a app.set('trust proxy', 1);" "$INSTALL_DIR/server/index.ts"
  fi
fi

# Fix 4: Update Nginx configuration for proper cookie and session handling
if [ -f "/etc/nginx/sites-available/simpleit" ]; then
  cat > "/etc/nginx/sites-available/simpleit" << EOL
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
        proxy_set_header Cookie \$http_cookie;
        
        # Configure proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Disable buffering for better real-time updates
    proxy_buffering off;
}
EOL
fi

# Fix 5: Update environment settings
cat > "$INSTALL_DIR/.env" << EOL
NODE_ENV=production
PORT=5000
USE_HTTPS=false
DATABASE_URL=postgres://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
SESSION_SECRET=$SESSION_SECRET
EOL

# Fix 6: Update systemd service
cat > "/etc/systemd/system/simpleit.service" << EOL
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

# Fix 7: Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - $APP_USER -c "cd $INSTALL_DIR && npm run build"

# Fix 8: Restart services
systemctl daemon-reload
systemctl restart simpleit
systemctl restart nginx

echo "Clean fix applied successfully."
echo "You should now be able to login with admin/admin123."