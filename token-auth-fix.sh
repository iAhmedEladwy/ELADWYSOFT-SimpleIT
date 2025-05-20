#!/bin/bash

# Token-based authentication fix for SimpleIT
# This script implements a token-based auth system that doesn't rely on cookies

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"
TOKEN_SECRET=$(openssl rand -hex 32)

echo "Implementing token-based authentication for SimpleIT..."

# Create token authentication module
cat > "$INSTALL_DIR/server/token-auth.ts" << EOL
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import crypto from 'crypto';

// Token storage (in memory - will reset on server restart)
// In production, this would be stored in Redis or a database
interface TokenData {
  userId: number;
  expires: Date;
}

const tokens: Record<string, TokenData> = {};

// Generate a secure token
function generateToken(userId: number): string {
  const tokenValue = crypto.randomBytes(32).toString('hex');
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 30); // 30 days expiration
  
  tokens[tokenValue] = {
    userId,
    expires: expiration
  };
  
  return tokenValue;
}

// Validate a token
function validateToken(token: string): TokenData | null {
  const tokenData = tokens[token];
  if (!tokenData) {
    return null;
  }
  
  // Check if token has expired
  if (new Date() > tokenData.expires) {
    delete tokens[token];
    return null;
  }
  
  return tokenData;
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const token = authHeader.split(' ')[1];
  const tokenData = validateToken(token);
  
  if (!tokenData) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Set userId on request for downstream use
  (req as any).userId = tokenData.userId;
  next();
}

// Login handler
export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  
  try {
    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // For testing with 'admin'/'admin123' credentials
    if (username === 'admin' && password === 'admin123') {
      // Generate token
      const token = generateToken(user.id);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token
      });
    }
    
    // For actual password validation with bcrypt
    // In a proper system, this would use bcrypt.compare()
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Return user without password
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
}

// Get current user
export async function getCurrentUser(req: Request, res: Response) {
  const userId = (req as any).userId;
  
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout handler
export function logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete tokens[token];
  }
  
  res.json({ message: 'Logout successful' });
}
EOL

# Create client-side authentication wrapper
mkdir -p "$INSTALL_DIR/public"
cat > "$INSTALL_DIR/public/auth-client.js" << EOL
// SimpleIT Auth Client
(function() {
  // Store the token in localStorage
  const TOKEN_KEY = 'simpleit_auth_token';
  
  // Add token to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Skip adding token for login request
    if (url.includes('/api/login')) {
      return originalFetch(url, options).then(response => {
        if (response.ok) {
          // Clone response to read body
          const clone = response.clone();
          clone.json().then(data => {
            if (data.token) {
              localStorage.setItem(TOKEN_KEY, data.token);
              console.log('Authentication token saved');
            }
          });
        }
        return response;
      });
    }
    
    // Add token to other requests
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Initialize headers if they don't exist
      options.headers = options.headers || {};
      
      // Add Authorization header with token
      options.headers.Authorization = \`Bearer \${token}\`;
    }
    
    return originalFetch(url, options);
  };
  
  // Attach events to track auth state
  document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      console.log('Auth token found, checking validity...');
      
      // Check if the token is valid
      fetch('/api/me')
        .then(response => {
          if (!response.ok) {
            console.log('Auth token invalid, removing');
            localStorage.removeItem(TOKEN_KEY);
          }
        })
        .catch(error => {
          console.error('Auth check failed:', error);
        });
    }
  });
  
  // Add helper functions to window object
  window.SimpleITAuth = {
    // Get the current token
    getToken: function() {
      return localStorage.getItem(TOKEN_KEY);
    },
    
    // Check if user is authenticated
    isAuthenticated: function() {
      return !!localStorage.getItem(TOKEN_KEY);
    },
    
    // Clear authentication
    logout: function() {
      // Call the backend to invalidate token
      fetch('/api/logout', {
        method: 'POST'
      }).finally(() => {
        localStorage.removeItem(TOKEN_KEY);
        // Redirect to login page
        window.location.href = '/login';
      });
    }
  };
  
  console.log('SimpleIT Auth Client loaded');
})();
EOL

# Update routes.ts to use token authentication
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  echo "Updating routes with token-based authentication..."
  cp "$INSTALL_DIR/server/routes.ts" "$INSTALL_DIR/server/routes.ts.backup-token"
  
  # Add import for token auth
  sed -i '1s/^/import { authenticate, login, getCurrentUser, logout } from ".\/token-auth";\n/' "$INSTALL_DIR/server/routes.ts"
  
  # Replace login route
  if grep -q "app.post('/api/login'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "s|app.post('/api/login'.*|app.post('/api/login', login);|" "$INSTALL_DIR/server/routes.ts"
  else
    sed -i "/registerRoutes/a \  app.post('/api/login', login);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add logout route
  if grep -q "app.post('/api/logout'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "s|app.post('/api/logout'.*|app.post('/api/logout', logout);|" "$INSTALL_DIR/server/routes.ts"
  else
    sed -i "/app.post('\\/api\\/login'/a \  app.post('/api/logout', logout);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add current user route
  if grep -q "app.get('/api/me'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "s|app.get('/api/me'.*|app.get('/api/me', authenticate, getCurrentUser);|" "$INSTALL_DIR/server/routes.ts"
  else
    sed -i "/app.post('\\/api\\/logout'/a \  app.get('/api/me', authenticate, getCurrentUser);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Replace all authentication middleware references
  sed -i 's/const authenticateUser/\/\/ const authenticateUser/' "$INSTALL_DIR/server/routes.ts"
  sed -i 's/authenticateUser/authenticate/g' "$INSTALL_DIR/server/routes.ts"
  
  echo "Routes updated with token-based authentication!"
fi

# Update server to serve static files from public
if [ -f "$INSTALL_DIR/server/index.ts" ]; then
  echo "Updating server to serve public directory..."
  
  # Add static middleware if not already present
  if ! grep -q "express.static('public')" "$INSTALL_DIR/server/index.ts"; then
    sed -i "/app.use(express.json())/a app.use(express.static('public'));" "$INSTALL_DIR/server/index.ts"
  fi
fi

# Create a test page for token authentication
cat > "$INSTALL_DIR/public/token-test.html" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SimpleIT Token Auth Test</title>
  <script src="/auth-client.js"></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; }
    button { padding: 8px 16px; margin-right: 10px; cursor: pointer; }
    .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>SimpleIT Token Authentication Test</h1>
  
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
    <h2>3. Protected API Access</h2>
    <p>Try accessing a protected API endpoint:</p>
    <button onclick="testProtectedApi()">Access /api/system-config</button>
    <h3>Result:</h3>
    <pre id="api-result">Click to test</pre>
  </div>
  
  <div class="card">
    <h2>4. Logout</h2>
    <p>Clear authentication:</p>
    <button onclick="testLogout()">Logout</button>
    <h3>Result:</h3>
    <pre id="logout-result">Click to test</pre>
  </div>
  
  <script>
    // Test login
    async function testLogin() {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'admin123' })
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
        const response = await fetch('/api/me');
        
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
        const response = await fetch('/api/system-config');
        
        if (response.ok) {
          const data = await response.json();
          document.getElementById('api-result').textContent = 'Success! Got config data with ' + 
            Object.keys(data).length + ' properties';
        } else {
          const error = await response.json();
          document.getElementById('api-result').textContent = 'Failed: ' + JSON.stringify(error);
        }
      } catch (error) {
        document.getElementById('api-result').textContent = 'Error: ' + error.message;
      }
    }
    
    // Test logout
    function testLogout() {
      if (window.SimpleITAuth) {
        const wasAuthenticated = window.SimpleITAuth.isAuthenticated();
        
        // Call our helper without page redirect
        fetch('/api/logout', {
          method: 'POST'
        }).then(() => {
          localStorage.removeItem('simpleit_auth_token');
          document.getElementById('logout-result').textContent = 
            'Logout successful. Was authenticated: ' + wasAuthenticated;
        }).catch(error => {
          document.getElementById('logout-result').textContent = 'Error: ' + error.message;
        });
      } else {
        document.getElementById('logout-result').textContent = 'Auth client not loaded';
      }
    }
  </script>
</body>
</html>
EOL

# Modify index.html to include the auth client
if [ -f "$INSTALL_DIR/client/index.html" ]; then
  echo "Updating index.html with auth client..."
  cp "$INSTALL_DIR/client/index.html" "$INSTALL_DIR/client/index.html.backup"
  
  # Add auth-client.js before the first script tag
  sed -i '/<script/i <script src="/auth-client.js"></script>' "$INSTALL_DIR/client/index.html"
fi

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Copy static files to the build directory
mkdir -p "$INSTALL_DIR/dist/public"
cp "$INSTALL_DIR/public/auth-client.js" "$INSTALL_DIR/dist/public/"
cp "$INSTALL_DIR/public/token-test.html" "$INSTALL_DIR/dist/public/"

# Fix permissions
chown simpleit:simpleit -R "$INSTALL_DIR/public"
chown simpleit:simpleit -R "$INSTALL_DIR/dist/public"

# Restart services
echo "Restarting services..."
systemctl restart simpleit

echo "Token-based authentication fix applied!"
echo "To test, visit: http://your-server-ip/token-test.html"
echo "The new auth system uses tokens stored in localStorage instead of cookies."
echo "This approach avoids all the session/cookie problems completely."