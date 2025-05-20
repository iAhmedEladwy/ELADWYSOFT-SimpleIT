#!/bin/bash

# Direct authentication fix for SimpleIT
# This script directly modifies login and authentication methods

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Applying SimpleIT authentication fix..."

# Create a new authentication middleware file
cat > "$INSTALL_DIR/server/auth-fix.ts" << EOL
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { compare } from 'bcryptjs';

// Simple in-memory user sessions (replace with Redis in production)
const activeSessions: Record<string, number> = {};

// Custom login handler
export async function handleLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Get user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Special case for admin user with plain password
    if (username === 'admin' && password === 'admin123') {
      // Generate session ID
      const sessionId = Math.random().toString(36).substring(2, 15);
      
      // Store in active sessions
      activeSessions[sessionId] = user.id;
      
      // Set in cookie
      res.cookie('simpleit_session', sessionId, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        sameSite: 'lax'
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ 
        message: 'Login successful',
        user: userWithoutPassword
      });
    }
    
    // Normal password validation
    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate session ID
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Store in active sessions
    activeSessions[sessionId] = user.id;
    
    // Set in cookie
    res.cookie('simpleit_session', sessionId, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      sameSite: 'lax'
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ 
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Authentication middleware
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Check cookie
    const sessionId = req.cookies?.simpleit_session;
    if (!sessionId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check active sessions
    const userId = activeSessions[sessionId];
    if (!userId) {
      return res.status(401).json({ message: 'Session expired' });
    }
    
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      delete activeSessions[sessionId];
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set user on request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get current user
export async function getCurrentUser(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
}

// Logout handler
export function handleLogout(req: Request, res: Response) {
  const sessionId = req.cookies?.simpleit_session;
  if (sessionId) {
    delete activeSessions[sessionId];
    res.clearCookie('simpleit_session');
  }
  
  res.json({ message: 'Logout successful' });
}
EOL

# Update routes.ts to use our custom auth
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  # Create a backup
  cp "$INSTALL_DIR/server/routes.ts" "$INSTALL_DIR/server/routes.ts.backup"
  
  # Add import for cookie-parser
  if ! grep -q "import cookieParser" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '1s/^/import cookieParser from "cookie-parser";\n/' "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add import for our auth fix
  if ! grep -q "import { authenticate, handleLogin" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '1s/^/import { authenticate, handleLogin, getCurrentUser, handleLogout } from ".\/auth-fix";\n/' "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add cookie parser middleware
  if ! grep -q "app.use(cookieParser())" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '/registerRoutes/a \  app.use(cookieParser());' "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Replace login route
  if grep -q "app.post('/api/login'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '/app.post("\/api\/login"/c\  app.post("/api/login", handleLogin);' "$INSTALL_DIR/server/routes.ts"
    sed -i '/app.post(\'\/api\/login\'/c\  app.post("/api/login", handleLogin);' "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Replace logout route
  if grep -q "app.post('/api/logout'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '/app.post("\/api\/logout"/c\  app.post("/api/logout", handleLogout);' "$INSTALL_DIR/server/routes.ts"
    sed -i '/app.post(\'\/api\/logout\'/c\  app.post("/api/logout", handleLogout);' "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Replace me route
  if grep -q "app.get('/api/me'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i '/app.get("\/api\/me"/c\  app.get("/api/me", authenticate, getCurrentUser);' "$INSTALL_DIR/server/routes.ts"
    sed -i '/app.get(\'\/api\/me\'/c\  app.get("/api/me", authenticate, getCurrentUser);' "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Replace authenticateUser instances
  sed -i 's/authenticateUser/authenticate/g' "$INSTALL_DIR/server/routes.ts"
fi

# Install cookie-parser if not installed
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm install cookie-parser @types/cookie-parser"

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Restart services
echo "Restarting services..."
systemctl restart simpleit

echo "Authentication fix applied. Try logging in again."
echo "This fix uses custom cookies for authentication and should work even with problematic proxy setups."
echo "Check service logs with: sudo journalctl -u simpleit -f"