#!/bin/bash

# Quick fix for TypeScript error in routes.ts
# Run this on your Ubuntu server

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Fixing TypeScript error in routes.ts..."

# Create backup
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  cp "$INSTALL_DIR/server/routes.ts" "$INSTALL_DIR/server/routes.ts.ts-error-backup"
fi

# Fix the error by wrapping problematic try-catch blocks
sed -i '/try {/!b;n;:a;/} catch (error: any) {/{s/} catch (error: any) {/} catch (error) {/g;b};n;ba' "$INSTALL_DIR/server/routes.ts"

# Rebuild the application
echo "Rebuilding SimpleIT..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Restart the service
echo "Restarting SimpleIT service..."
systemctl restart simpleit

echo "TypeScript error fix complete!"
echo "Check if build succeeded without errors using: journalctl -u simpleit -n 50"