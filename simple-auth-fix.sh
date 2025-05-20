#!/bin/bash

# Ultra-simple authentication fix for SimpleIT
# This script directly modifies the authentication mechanism in a minimally invasive way

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Applying minimal authentication fix for SimpleIT..."

# Create a simple authentication middleware that uses localStorage
cat > "$INSTALL_DIR/server/simple-auth.ts" << EOL
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// This implements a simple token-based authentication
export const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Store active tokens with user IDs
const activeTokens: Record<string, number> = {};

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const token = authHeader.split(' ')[1];
  const userId = activeTokens[token];
  
  if (!userId) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Get user from storage
  const user = await storage.getUser(userId);
  if (!user) {
    delete activeTokens[token]; // Clean up invalid token
    return res.status(401).json({ message: 'User not found' });
  }
  
  // Attach user to request
  (req as any).user = user;
  next();
};

// Login handler
export const handleLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  try {
    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Simple password check (compare with bcrypt in production)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate and store token
    const token = generateToken();
    activeTokens[token] = user.id;
    
    // Return user data and token
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout handler
export const handleLogout = (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete activeTokens[token];
  }
  res.json({ message: 'Logout successful' });
};

// Get current user handler
export const getCurrentUser = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
};
EOL

# Update routes.ts to use our simple authentication
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  echo "Updating routes.ts with simplified authentication..."
  cp "$INSTALL_DIR/server/routes.ts" "$INSTALL_DIR/server/routes.ts.backup-simple"
  
  # Add the new imports at the top 
  sed -i '1s/^/import { authenticate, handleLogin, handleLogout, getCurrentUser } from ".\/simple-auth";\n/' "$INSTALL_DIR/server/routes.ts"
  
  # Replace any existing login route
  if grep -q "app.post('/api/login'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "s|app.post('/api/login'.*|app.post('/api/login', handleLogin);|" "$INSTALL_DIR/server/routes.ts"
  else
    # Add login route if doesn't exist
    sed -i "/registerRoutes/a \  app.post('/api/login', handleLogin);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add logout route if doesn't exist
  if ! grep -q "app.post('/api/logout'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "/app.post('\\/api\\/login'/a \  app.post('/api/logout', handleLogout);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add current user route
  if ! grep -q "app.get('/api/me'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "/app.post('\\/api\\/logout'/a \  app.get('/api/me', authenticate, getCurrentUser);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Replace the authenticateUser middleware with our authenticate
  sed -i 's/const authenticateUser/\/\/ const authenticateUser/' "$INSTALL_DIR/server/routes.ts"
  sed -i 's/return authenticateUser/return authenticate/' "$INSTALL_DIR/server/routes.ts"
  
  echo "Routes updated with simplified authentication!"
fi

# Create a ClientJS fix for token management
echo "Creating client-side fix for authentication..."
mkdir -p "$INSTALL_DIR/public"
cat > "$INSTALL_DIR/public/auth-fix.js" << EOL
// Authentication fix for SimpleIT client
(function() {
  // Replace fetch to add authentication token
  const originalFetch = window.fetch;
  window.fetch = function(resource, options) {
    // Get options or create empty object
    options = options || {};
    
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token && !resource.includes('/api/login')) {
      // Create headers if not exist
      options.headers = options.headers || {};
      
      // Add Authorization header
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    
    // Call original fetch
    return originalFetch(resource, options).then(response => {
      // Intercept login response to save token
      if (resource.includes('/api/login') && response.ok) {
        // Clone response to read body
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          if (data.token) {
            localStorage.setItem('auth_token', data.token);
            console.log('Token saved to localStorage');
          }
        });
      }
      
      // Return original response
      return response;
    });
  };
  
  // Add script to index.html
  console.log('Authentication fix applied on client');
})();
EOL

# Update index.html to load our auth-fix.js
if [ -f "$INSTALL_DIR/dist/public/index.html" ]; then
  echo "Updating index.html to load auth fix..."
  cp "$INSTALL_DIR/dist/public/index.html" "$INSTALL_DIR/dist/public/index.html.backup"
  
  # Add auth-fix.js before first <script> tag
  sed -i '/<script/i <script src="/auth-fix.js"></script>' "$INSTALL_DIR/dist/public/index.html"
else
  echo "index.html not found, will be fixed during build"
fi

# Modify express static serving
if [ -f "$INSTALL_DIR/server/index.ts" ]; then
  echo "Updating server to serve public directory..."
  cp "$INSTALL_DIR/server/index.ts" "$INSTALL_DIR/server/index.ts.backup-public"
  
  # Add express.static for public directory
  if ! grep -q "app.use(express.static" "$INSTALL_DIR/server/index.ts"; then
    sed -i "/app.use(express.json())/a app.use(express.static('public'));" "$INSTALL_DIR/server/index.ts"
  fi
fi

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Setup auth-fix.js in final location
mkdir -p "$INSTALL_DIR/dist/public"
cp "$INSTALL_DIR/public/auth-fix.js" "$INSTALL_DIR/dist/public/"

# Fix permissions
chown simpleit:simpleit -R "$INSTALL_DIR/dist/public"

# Restart services
echo "Restarting services..."
systemctl restart simpleit

echo "Simple authentication fix applied! Try logging in again."
echo "This fix uses token-based authentication which will be more reliable."
echo "If issues persist, check the logs with: sudo journalctl -u simpleit -f"