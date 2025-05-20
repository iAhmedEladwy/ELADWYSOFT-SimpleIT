#!/bin/bash

# Direct fix for SimpleIT WebSocket issues on Ubuntu
# Run this on your Ubuntu server where SimpleIT is deployed

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

# Backup existing files
echo "Creating backups of original files..."
if [ -f "$INSTALL_DIR/server/db.ts" ]; then
  cp "$INSTALL_DIR/server/db.ts" "$INSTALL_DIR/server/db.ts.bak"
fi

# Create fixed db.ts file
echo "Creating fixed database configuration..."
cat > "$INSTALL_DIR/server/db.ts" << EOL
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Completely disable WebSocket secure connections
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = false;
neonConfig.forceDisablePgSSL = true;

// Parse and modify connection string if needed to force non-SSL
if (process.env.DATABASE_URL) {
  // If the URL includes SSL parameters, modify them
  let connectionString = process.env.DATABASE_URL;
  if (connectionString.includes('?')) {
    // Already has parameters
    if (!connectionString.includes('sslmode=')) {
      connectionString += '&sslmode=disable';
    } else {
      connectionString = connectionString.replace(/sslmode=[^&]+/, 'sslmode=disable');
    }
  } else {
    // No parameters yet
    connectionString += '?sslmode=disable';
  }
  
  // Create pool with the modified connection string
  export const pool = new Pool({ connectionString });
  export const db = drizzle({ client: pool, schema });
} else {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
EOL

# Set proper ownership and permissions
chown simpleit:simpleit "$INSTALL_DIR/server/db.ts"
chmod 644 "$INSTALL_DIR/server/db.ts"

# Fix WebSocket configuration in all environment files
echo "Updating .env file with correct settings..."
if [ -f "$INSTALL_DIR/.env" ]; then
  # Add/update USE_HTTPS setting
  if grep -q "USE_HTTPS" "$INSTALL_DIR/.env"; then
    sed -i 's/USE_HTTPS=.*/USE_HTTPS=false/' "$INSTALL_DIR/.env"
  else
    echo "USE_HTTPS=false" >> "$INSTALL_DIR/.env"
  fi
fi

# Update systemd service to include environment variables
echo "Updating systemd service configuration..."
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

# Ensure all environment variables are explicitly set
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=USE_HTTPS=false
Environment=DATABASE_URL=postgres://simpleit:simpleit@localhost:5432/simpleit
Environment=REPLIT_DOMAINS=localhost
Environment=ISSUER_URL=http://localhost:5000
Environment=REPL_ID=simpleit-production

# Also load from .env file if it exists
EnvironmentFile=-$INSTALL_DIR/.env

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
systemctl restart nginx

echo "Fix applied. Check service status with: sudo systemctl status simpleit"