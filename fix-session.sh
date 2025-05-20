#!/bin/bash

# Fix script for SimpleIT session management issues
# Run this on your Ubuntu server where SimpleIT is deployed

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Fixing SimpleIT session management..."

# Fix session configuration in replitAuth.ts
if [ -f "$INSTALL_DIR/server/replitAuth.ts" ]; then
  echo "Updating session management configuration..."
  
  # Create a backup
  cp "$INSTALL_DIR/server/replitAuth.ts" "$INSTALL_DIR/server/replitAuth.ts.backup-session"
  
  # Replace session configurations
  sed -i 's|secure: false|secure: false, sameSite: "lax"|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|resave: false|resave: true|g' "$INSTALL_DIR/server/replitAuth.ts"
  sed -i 's|saveUninitialized: false|saveUninitialized: true|g' "$INSTALL_DIR/server/replitAuth.ts"
  
  echo "Session configuration updated."
else
  echo "replitAuth.ts not found! Creating a custom session fix..."
  
  # Create session-fix.ts file
  cat > "$INSTALL_DIR/server/session-fix.ts" << EOL
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

export function configureSession(app: any) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool, 
    createTableIfMissing: true,
    tableName: 'sessions',
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'simpleit-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    }
  }));
}
EOL

  chown simpleit:simpleit "$INSTALL_DIR/server/session-fix.ts"
  
  # Update index.ts to use our session fix
  if [ -f "$INSTALL_DIR/server/index.ts" ]; then
    cp "$INSTALL_DIR/server/index.ts" "$INSTALL_DIR/server/index.ts.backup-session"
    
    # Find the express setup line and add our session configuration after it
    sed -i '/const app = express();/a import { configureSession } from "./session-fix";\nconfigureSession(app);' "$INSTALL_DIR/server/index.ts"
    
    echo "Custom session fix added to index.ts"
  else
    echo "index.ts not found! Unable to apply custom session fix."
  fi
fi

# Update routes.ts to fix authentication middleware
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  echo "Updating authentication middleware..."
  cp "$INSTALL_DIR/server/routes.ts" "$INSTALL_DIR/server/routes.ts.backup-session"
  
  # Find the authenticateUser function and update it to better handle sessions
  sed -i '/const authenticateUser/,/next: Function/c\const authenticateUser = (req: Request, res: Response, next: Function) => {\n  if (!req.session || !req.session.user) {\n    return res.status(401).json({ message: "Not authenticated" });\n  }\n  next();\n};' "$INSTALL_DIR/server/routes.ts"
  
  echo "Authentication middleware updated."
fi

# Update .env file with secure session secret
echo "Updating session secret in .env file..."
if [ -f "$INSTALL_DIR/.env" ]; then
  # Generate a new session secret
  NEW_SECRET=$(openssl rand -hex 32)
  
  # Add or update SESSION_SECRET
  if grep -q "SESSION_SECRET" "$INSTALL_DIR/.env"; then
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$NEW_SECRET/" "$INSTALL_DIR/.env"
  else
    echo "SESSION_SECRET=$NEW_SECRET" >> "$INSTALL_DIR/.env"
  fi
fi

# Update systemd service to include session secret
echo "Updating systemd service with session secret..."
if [ -f "/etc/systemd/system/simpleit.service" ]; then
  # Generate a new session secret
  NEW_SECRET=$(openssl rand -hex 32)
  
  # Update or add SESSION_SECRET to the service file
  if grep -q "SESSION_SECRET=" "/etc/systemd/system/simpleit.service"; then
    sed -i "s/Environment=SESSION_SECRET=.*/Environment=SESSION_SECRET=$NEW_SECRET/" "/etc/systemd/system/simpleit.service"
  else
    sed -i "/Environment=.*/a Environment=SESSION_SECRET=$NEW_SECRET" "/etc/systemd/system/simpleit.service"
  fi
fi

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Restart services
echo "Restarting services..."
systemctl daemon-reload
systemctl restart simpleit

echo "Session management fix applied. Try logging in again."
echo "If issues persist, check the logs with: sudo journalctl -u simpleit -f"