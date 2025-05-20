#!/bin/bash

# Fix script for SimpleIT WebSocket 502 errors on Ubuntu
# Run this on your Ubuntu server where SimpleIT is deployed

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Applying SimpleIT WebSocket 502 error fix..."

# Create fixed database configuration with direct PostgreSQL connection
echo "Creating fixed database configuration with direct PostgreSQL connection..."
cat > "$INSTALL_DIR/server/db.ts.fixed" << EOL
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

# Set proper ownership and permissions
chown simpleit:simpleit "$INSTALL_DIR/server/db.ts.fixed"
chmod 644 "$INSTALL_DIR/server/db.ts.fixed"

# Backup and replace the original file
mv "$INSTALL_DIR/server/db.ts" "$INSTALL_DIR/server/db.ts.backup2"
mv "$INSTALL_DIR/server/db.ts.fixed" "$INSTALL_DIR/server/db.ts"

# Update package.json to include pg instead of @neondatabase/serverless
echo "Installing direct PostgreSQL client instead of Neon Serverless..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm install pg @types/pg"

# Fix authentication settings
echo "Updating authentication settings..."
if [ -f "$INSTALL_DIR/server/replitAuth.ts" ]; then
  # Create a backup
  cp "$INSTALL_DIR/server/replitAuth.ts" "$INSTALL_DIR/server/replitAuth.ts.backup2"
  
  # Replace HTTPS URLs with HTTP in the file
  sed -i 's|callbackURL: `https://${domain}/api/callback`|callbackURL: `http://${domain}/api/callback`|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|secure: process.env.NODE_ENV === "production"|secure: false|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|post_logout_redirect_uri: `${req.protocol}://${req.hostname}`|post_logout_redirect_uri: `http://${req.hostname}`|g' "$INSTALL_DIR/server/replitAuth.ts"
fi

# Modify Nginx config to properly handle WebSockets
echo "Fixing Nginx configuration for WebSockets..."
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
        
        # Configure proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOL

# Reload Nginx config
nginx -t && systemctl reload nginx

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Restart services
echo "Restarting services..."
systemctl daemon-reload
systemctl restart simpleit

echo "Fix applied. Check the service status with: sudo systemctl status simpleit"
echo "If you still encounter issues, check Nginx logs: sudo tail -f /var/log/nginx/error.log"