#!/bin/bash

# Quick fix script for SimpleIT WebSocket issues on Ubuntu
# Run this on your Ubuntu server where SimpleIT is deployed

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Applying SimpleIT WebSocket and database connectivity fix..."

# Create fixed database configuration
echo "Creating fixed database configuration..."
cat > "$INSTALL_DIR/server/db.ts.fixed" << EOL
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database settings
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = false;
neonConfig.forceDisablePgSSL = true;

// Check for database connection string
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create pool with connection string
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

export { pool, db };
EOL

# Set proper ownership and permissions
chown simpleit:simpleit "$INSTALL_DIR/server/db.ts.fixed"
chmod 644 "$INSTALL_DIR/server/db.ts.fixed"

# Backup and replace the original file
mv "$INSTALL_DIR/server/db.ts" "$INSTALL_DIR/server/db.ts.backup"
mv "$INSTALL_DIR/server/db.ts.fixed" "$INSTALL_DIR/server/db.ts"

# Fix authentication settings
echo "Fixing authentication settings..."
if [ -f "$INSTALL_DIR/server/replitAuth.ts" ]; then
  # Create a backup
  cp "$INSTALL_DIR/server/replitAuth.ts" "$INSTALL_DIR/server/replitAuth.ts.backup"
  
  # Replace HTTPS URLs with HTTP in the file
  sed -i 's|callbackURL: `https://${domain}/api/callback`|callbackURL: `http://${domain}/api/callback`|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|secure: process.env.NODE_ENV === "production"|secure: false|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|post_logout_redirect_uri: `${req.protocol}://${req.hostname}`|post_logout_redirect_uri: `http://${req.hostname}`|g' "$INSTALL_DIR/server/replitAuth.ts"
  
  echo "Authentication settings fixed."
fi

# Update environment settings in the service file
echo "Updating systemd service..."
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

# Essential environment variables
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=USE_HTTPS=false
Environment=DATABASE_URL=postgres://simpleit:simpleit@localhost:5432/simpleit
Environment=SESSION_SECRET=$(openssl rand -hex 32)
Environment=REPLIT_DOMAINS=localhost
Environment=ISSUER_URL=http://localhost:5000
Environment=REPL_ID=simpleit-production

[Install]
WantedBy=multi-user.target
EOL

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Restart services
echo "Restarting services..."
systemctl daemon-reload
systemctl restart simpleit

echo "Fix applied. Check the service status with: sudo systemctl status simpleit"