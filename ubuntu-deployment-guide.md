# Ubuntu Deployment Guide for SimpleIT

## Quick Setup for Local Ubuntu Development

### 1. Database Setup
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE simpleit;
CREATE USER simpleit_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit_user;
\q
```

### 2. Environment Configuration
Create `.env` file in project root:
```
DATABASE_URL=postgresql://simpleit_user:your_secure_password@localhost:5432/simpleit
NODE_ENV=development
PORT=5000
```

### 3. Install Dependencies and Setup
```bash
# Install Node.js 20 (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install project dependencies
npm install

# Push database schema
npm run db:push

# Start the application
npm run dev
```

### 4. Performance Optimizations Active
All the following improvements work on Ubuntu:
- ✅ Client-side navigation for instant ticket details loading
- ✅ Smart prefetching and intelligent caching (15-30 min)
- ✅ Enhanced error handling preventing white pages
- ✅ Cross-platform authentication fixes
- ✅ Optimized loading states with background data preloading

### 5. Troubleshooting Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql
```

#### Port Conflicts
```bash
# Check if port 5000 is in use
sudo netstat -tlnp | grep :5000

# Kill process if needed
sudo kill -9 <PID>
```

#### Permission Issues
```bash
# Fix file permissions
chmod +x scripts/*.sh
sudo chown -R $USER:$USER node_modules/
```

### 6. Production Deployment
For production Ubuntu server deployment, use PM2:
```bash
# Install PM2 globally
npm install -g pm2

# Create production environment file
cp .env .env.production

# Start with PM2
pm2 start npm --name "simpleit" -- run dev
pm2 save
pm2 startup
```

### 7. Nginx Configuration (Optional)
For production with reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Verification Steps
1. Database connection test: `npm run db:push`
2. Application start: `npm run dev`
3. Login test: Access http://localhost:5000 and login with admin/admin
4. Performance test: Navigate to tickets and test "View Details" speed
5. Cross-platform test: Test both row clicks and action menu navigation

## Contact
If you encounter any issues, check the logs in the terminal or browser console for specific error messages.