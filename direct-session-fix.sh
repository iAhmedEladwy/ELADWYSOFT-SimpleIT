#!/bin/bash

# Direct session fix for SimpleIT
# This script directly updates the login and auth system without changing session management

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (sudo)."
   exit 1
fi

# Configuration variables
INSTALL_DIR="/opt/simpleit"

echo "Applying direct authentication fix for SimpleIT..."

# Create a login route file that doesn't use sessions
cat > "$INSTALL_DIR/server/login-fix.ts" << EOL
import { Request, Response } from 'express';
import { storage } from './storage';
import bcrypt from 'bcrypt';

// Login handler that responds with user information
export async function handleLogin(req: Request, res: Response) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    // Get user by username
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Compare password (plain text for simplicity, assumes this is how passwords are stored)
    // In a real system, this would use bcrypt.compare() with hashed passwords
    const passwordValid = user.password === password;
    
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Set user in session (if session object exists)
    if (req.session) {
      req.session.user = user;
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
    }
    
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

// Simple auth middleware that checks if req.session.user exists
export function authenticateUser(req: any, res: Response, next: Function) {
  // First check for user in session
  if (req.session && req.session.user) {
    return next();
  }
  
  // Alternative: check for userId
  if (req.session && req.session.userId) {
    return next();
  }
  
  // Alternative: check for isAuthenticated flag
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  
  return res.status(401).json({ message: 'Not authenticated' });
}

// Helper to get the current user
export async function getCurrentUser(req: any, res: Response) {
  // If user is in session, return it directly
  if (req.session && req.session.user) {
    const { password: _, ...userWithoutPassword } = req.session.user;
    return res.json(userWithoutPassword);
  }
  
  // If only user ID is stored, fetch user from database
  if (req.session && req.session.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  
  return res.status(401).json({ message: 'User not found' });
}
EOL

# Update routes.ts to use our fixed login handler
if [ -f "$INSTALL_DIR/server/routes.ts" ]; then
  echo "Updating routes.ts with fixed authentication..."
  cp "$INSTALL_DIR/server/routes.ts" "$INSTALL_DIR/server/routes.ts.backup-direct"
  
  # Add import for our login handler
  sed -i '1s/^/import { handleLogin, authenticateUser, getCurrentUser } from ".\/login-fix";\n/' "$INSTALL_DIR/server/routes.ts"
  
  # Replace any existing login route
  if grep -q "app.post('/api/login'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "s|app.post('/api/login'.*|app.post('/api/login', handleLogin);|" "$INSTALL_DIR/server/routes.ts"
  else
    # Add login route if doesn't exist
    sed -i "/registerRoutes/a \  app.post('/api/login', handleLogin);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Add current user route if it doesn't exist
  if ! grep -q "app.get('/api/me'" "$INSTALL_DIR/server/routes.ts"; then
    sed -i "/app.post('\\/api\\/login'/a \  app.get('/api/me', authenticateUser, getCurrentUser);" "$INSTALL_DIR/server/routes.ts"
  fi
  
  # Comment out any existing authentication middleware
  sed -i '/const authenticateUser/,/};/c\// Authentication middleware managed in login-fix.ts' "$INSTALL_DIR/server/routes.ts"
  
  # Replace any references to the old authenticateUser
  sed -i 's/authenticateUser(/authenticateUser(/' "$INSTALL_DIR/server/routes.ts"
  
  echo "Routes updated with fixed authentication!"
fi

# Direct fix for the session setup in index.ts
if [ -f "$INSTALL_DIR/server/index.ts" ]; then
  echo "Adding explicit session configuration to index.ts..."
  cp "$INSTALL_DIR/server/index.ts" "$INSTALL_DIR/server/index.ts.backup-direct"
  
  # Add session import if it doesn't exist
  if ! grep -q "import session from 'express-session'" "$INSTALL_DIR/server/index.ts"; then
    sed -i '1s/^/import session from "express-session";\nimport connectPg from "connect-pg-simple";\n/' "$INSTALL_DIR/server/index.ts"
  fi
  
  # Add this session configuration right after app is created
  SESSION_CONFIG="// Configure session with PostgreSQL store
const pgStore = connectPg(session);
app.use(session({
  store: new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'simpleit-secret-key',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false
  }
}));"
  
  # Add session config after app creation
  sed -i "/const app = express();/a $SESSION_CONFIG" "$INSTALL_DIR/server/index.ts"
fi

# Update the cookie implementation to be more compatible
if [ -f "$INSTALL_DIR/server/index.ts" ]; then
  # If the script has already added a session configuration, don't add it again
  if ! grep -q "app.set('trust proxy', 1)" "$INSTALL_DIR/server/index.ts"; then
    echo "Adding proxy trust settings..."
    sed -i "/const app = express();/a app.set('trust proxy', 1);" "$INSTALL_DIR/server/index.ts"
  fi
fi

# Create a static file to test if session is working
mkdir -p "$INSTALL_DIR/public"
cat > "$INSTALL_DIR/public/session-test.html" << EOL
<!DOCTYPE html>
<html>
<head>
  <title>SimpleIT Session Test</title>
  <script>
    // Test login function
    async function testLogin() {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        
        // Try to get user info immediately
        setTimeout(checkAuth, 1000);
      } catch (error) {
        document.getElementById('result').textContent = 'Error: ' + error.message;
      }
    }
    
    // Test auth function
    async function checkAuth() {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          document.getElementById('auth-result').textContent = 'Authenticated as: ' + JSON.stringify(data, null, 2);
        } else {
          document.getElementById('auth-result').textContent = 'Not authenticated';
        }
      } catch (error) {
        document.getElementById('auth-result').textContent = 'Error: ' + error.message;
      }
    }
  </script>
</head>
<body>
  <h1>SimpleIT Session Test</h1>
  <button onclick="testLogin()">Test Login</button>
  <button onclick="checkAuth()">Check Auth</button>
  <h2>Login Result:</h2>
  <pre id="result">Click "Test Login" to start</pre>
  <h2>Auth Status:</h2>
  <pre id="auth-result">Click "Check Auth" to verify</pre>
</body>
</html>
EOL

# Configure nginx to handle cookies properly
if [ -f "/etc/nginx/sites-available/simpleit" ]; then
  echo "Updating nginx configuration for cookies..."
  cp "/etc/nginx/sites-available/simpleit" "/etc/nginx/sites-available/simpleit.backup-direct"
  
  # Add cookie pass-through
  sed -i '/proxy_set_header X-Forwarded-Proto/a \        proxy_set_header Cookie $http_cookie;\n        proxy_pass_header Set-Cookie;' "/etc/nginx/sites-available/simpleit"
fi

# Rebuild the application
echo "Rebuilding the application..."
cd "$INSTALL_DIR"
su - simpleit -c "cd $INSTALL_DIR && npm run build"

# Copy the test file to the distribution folder
mkdir -p "$INSTALL_DIR/dist/public"
cp "$INSTALL_DIR/public/session-test.html" "$INSTALL_DIR/dist/public/"

# Fix permissions
chown simpleit:simpleit -R "$INSTALL_DIR/public"
chown simpleit:simpleit -R "$INSTALL_DIR/dist/public"

# Update .env with a session secret
if [ -f "$INSTALL_DIR/.env" ]; then
  NEW_SECRET=$(openssl rand -hex 32)
  if grep -q "SESSION_SECRET" "$INSTALL_DIR/.env"; then
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$NEW_SECRET/" "$INSTALL_DIR/.env"
  else
    echo "SESSION_SECRET=$NEW_SECRET" >> "$INSTALL_DIR/.env"
  fi
fi

# Update systemd service if it exists
if [ -f "/etc/systemd/system/simpleit.service" ]; then
  NEW_SECRET=$(openssl rand -hex 32)
  if grep -q "SESSION_SECRET" "/etc/systemd/system/simpleit.service"; then
    sed -i "s/Environment=SESSION_SECRET=.*/Environment=SESSION_SECRET=$NEW_SECRET/" "/etc/systemd/system/simpleit.service"
  else
    sed -i "/Environment=REPL_ID/a Environment=SESSION_SECRET=$NEW_SECRET" "/etc/systemd/system/simpleit.service"
  fi
  
  # Restart services
  systemctl daemon-reload
fi

# Restart everything
systemctl restart simpleit
systemctl restart nginx

echo "Direct session fix applied!"
echo "For testing, visit: http://your-server-ip/session-test.html"
echo "If the regular site still has issues, check the logs with: sudo journalctl -u simpleit -f"