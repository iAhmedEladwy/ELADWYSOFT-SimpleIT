# SimpleIT Deployment Guide

This document outlines the steps to deploy the SimpleIT Asset Management System using Docker (recommended for simplicity) or on Ubuntu and Windows servers.

## Quick Start (Docker)

### Option 1: One-Click Deployment Script (Easiest)

We provide a simple one-click deployment script that handles everything automatically:

```bash
# Clone repository
git clone https://github.com/eladwysoft/simpleit.git && cd simpleit

# Make the deployment script executable
chmod +x docs/deploy-script.sh

# Run the deployment script
./docs/deploy-script.sh
```

The script will:
1. Create all necessary Docker configuration files
2. Start the Docker containers
3. Initialize the database
4. Provide instructions for accessing the application

### Option 2: Manual Docker Setup

If you prefer to set up manually:

```bash
# Clone repository
git clone https://github.com/eladwysoft/simpleit.git && cd simpleit

# Create docker-compose.yml and Dockerfile (see Docker Deployment section below)

# Deploy with Docker
docker-compose up -d

# Initialize database (first time only)
docker-compose exec app npm run db:push

# Access the application at http://your-server-ip
# Default login: admin / admin123
```

## Prerequisites

### For Docker Deployment (Recommended)
- Docker 20.10.x or higher
- Docker Compose 2.x or higher
- At least 2GB of RAM and 1GB of free disk space

### For Traditional Deployment
- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Git (for cloning the repository)
- At least 2GB of RAM and 1GB of free disk space

## Docker Deployment (Recommended)

Docker deployment is the recommended method for deploying SimpleIT as it greatly simplifies the process and ensures a consistent environment across different platforms.

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/eladwysoft/simpleit.git
cd simpleit
```

### 2. Create Docker Configuration Files

Create a `docker-compose.yml` file in the project root directory:

```yaml
version: '3.8'

services:
  # PostgreSQL database
  postgres:
    image: postgres:14
    container_name: simpleit-postgres
    restart: always
    environment:
      POSTGRES_USER: simpleituser
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: simpleit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U simpleituser -d simpleit"]
      interval: 10s
      timeout: 5s
      retries: 5

  # SimpleIT application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: simpleit-app
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://simpleituser:your_secure_password@postgres:5432/simpleit
      SESSION_SECRET: your_long_random_session_secret
    ports:
      - "80:3000"
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
```

Create a `Dockerfile` in the project root directory:

```Dockerfile
# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### 3. Deploy the Application

```bash
# Build and start the containers
docker-compose up -d

# Initialize the database (first time only)
docker-compose exec app npm run db:push

# View logs
docker-compose logs -f
```

### 4. Access the Application

Once the containers are running, you can access the SimpleIT application by navigating to:

```
http://your-server-ip
```

The default admin credentials are:
- Username: admin
- Password: admin123

### 5. Update the Application

To update the application when new code is available:

```bash
# Pull the latest code
git pull

# Rebuild and restart the containers
docker-compose down
docker-compose up --build -d
```

### 6. Backup and Restore

To backup the database:

```bash
# Create a backup
docker-compose exec postgres pg_dump -U simpleituser simpleit > simpleit_backup_$(date +%Y%m%d).sql
```

To restore from a backup:

```bash
# Stop the containers
docker-compose down

# Start only the database
docker-compose up -d postgres

# Wait for the database to be ready
sleep 10

# Restore from backup
cat your_backup_file.sql | docker exec -i simpleit-postgres psql -U simpleituser -d simpleit

# Start the application
docker-compose up -d
```

## Deployment on Ubuntu

### 1. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js and npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v18.x.x
npm -v   # Should show 8.x.x or higher
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql -c "SELECT version();"
```

### 4. Configure PostgreSQL

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create a database and user for SimpleIT
CREATE DATABASE simpleit;
CREATE USER simpleituser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleituser;

# Exit PostgreSQL
\q
```

### 5. Clone the Repository

```bash
# Navigate to the directory where you want to deploy
cd /opt

# Clone the repository (replace with your actual repository URL)
sudo git clone https://github.com/eladwysoft/simpleit.git
cd simpleit

# Set permissions
sudo chown -R $USER:$USER /opt/simpleit
```

### 6. Install Dependencies

```bash
# Install project dependencies
npm install
```

### 7. Configure Environment Variables

Create a `.env` file in the project root:

```bash
touch .env
nano .env
```

Add the following environment variables:

```
# Database Configuration
DATABASE_URL=postgres://simpleituser:your_secure_password@localhost:5432/simpleit

# Session Configuration
SESSION_SECRET=your_long_random_session_secret

# Server Configuration
PORT=3000
```

### 8. Initialize the Database

```bash
# Apply database migrations
npm run db:push
```

### 9. Build the Application

```bash
# Build the frontend
npm run build
```

### 10. Set Up a Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start npm --name "simpleit" -- start

# Configure PM2 to start on system boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save
```

### 11. Configure Nginx as a Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/simpleit
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/simpleit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 12. Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your_domain.com

# Test renewal
sudo certbot renew --dry-run
```

## Deployment on Windows

### 1. Install Node.js

1. Download the Node.js installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the instructions
3. Verify installation by opening Command Prompt and running:
   ```
   node -v
   npm -v
   ```

### 2. Install PostgreSQL

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the instructions
   - Note the password you set for the 'postgres' user
   - Keep the default port (5432)
3. After installation, open pgAdmin (installed with PostgreSQL)

### 3. Configure PostgreSQL

1. Open pgAdmin and connect to the server
2. Create a new database named 'simpleit'
3. Create a new login role:
   - Name: simpleituser
   - Password: your_secure_password
   - Privileges: Can login, Create database

### 4. Clone the Repository

1. Download and install Git from [git-scm.com](https://git-scm.com/download/win)
2. Open Command Prompt as administrator
3. Navigate to your desired installation directory:
   ```
   cd C:\
   mkdir SimpleIT
   cd SimpleIT
   ```
4. Clone the repository:
   ```
   git clone https://github.com/eladwysoft/simpleit.git .
   ```

### 5. Install Dependencies

```
npm install
```

### 6. Configure Environment Variables

1. Create a file named `.env` in the project root directory
2. Add the following environment variables:

```
# Database Configuration
DATABASE_URL=postgres://simpleituser:your_secure_password@localhost:5432/simpleit

# Session Configuration
SESSION_SECRET=your_long_random_session_secret

# Server Configuration
PORT=3000
```

### 7. Initialize the Database

```
npm run db:push
```

### 8. Build the Application

```
npm run build
```

### 9. Install Windows Service Manager (optional)

For production environments, it's recommended to run the application as a Windows service:

1. Install node-windows globally:
   ```
   npm install -g node-windows
   ```

2. Create a service installation script in the project directory:
   Create a file named `install-service.js`:

   ```javascript
   const Service = require('node-windows').Service;
   const path = require('path');

   // Create a new service object
   const svc = new Service({
     name: 'SimpleIT Asset Management',
     description: 'SimpleIT Asset Management System',
     script: path.join(__dirname, 'server/index.js'),
     nodeOptions: [],
     env: {
       name: "NODE_ENV",
       value: "production"
     }
   });

   // Listen for the "install" event
   svc.on('install', function() {
     svc.start();
     console.log('Service installed successfully');
   });

   // Install the service
   svc.install();
   ```

3. Run the script to install the service:
   ```
   node install-service.js
   ```

### 10. Configure IIS as a Reverse Proxy (optional)

For production environments, you can use IIS as a reverse proxy:

1. Install IIS from Windows Features
2. Install URL Rewrite module for IIS
3. Install Application Request Routing for IIS
4. Configure URL Rewrite rules to forward requests to your Node.js application

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql` (Ubuntu) or check Services in Windows
- Check database credentials and connection string in `.env`
- Ensure the database user has appropriate permissions

#### Node.js Application Won't Start

- Check for errors in the application logs
- Verify Node.js is installed correctly: `node -v`
- Ensure all dependencies are installed: `npm install`
- Verify environment variables are set correctly

#### Permission Issues (Ubuntu)

- Ensure the application directory has appropriate permissions: `sudo chown -R $USER:$USER /path/to/simpleit`
- Check if the process has permission to bind to the specified port

#### Port Conflicts

- Verify no other service is using the specified port: `sudo netstat -tuln | grep PORT` (Ubuntu) or `netstat -an | find "PORT"` (Windows)
- Change the port in your `.env` file if needed

## Maintenance

### Backup Procedures

#### Database Backup

Ubuntu:
```bash
# Backup the database
pg_dump -U simpleituser -d simpleit > simpleit_backup_$(date +%Y%m%d).sql
```

Windows:
```
pg_dump -U simpleituser -d simpleit > simpleit_backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%.sql
```

### Update Procedures

1. Stop the application:
   - Ubuntu: `pm2 stop simpleit`
   - Windows: Stop the Windows service from Services management console

2. Backup the database

3. Pull the latest changes:
   ```
   git pull origin main
   ```

4. Install any new dependencies:
   ```
   npm install
   ```

5. Apply database migrations:
   ```
   npm run db:push
   ```

6. Rebuild the application:
   ```
   npm run build
   ```

7. Restart the application:
   - Ubuntu: `pm2 start simpleit`
   - Windows: Start the Windows service from Services management console

## Security Considerations

- Always use strong, unique passwords for the database and admin user
- Keep the system and all dependencies updated
- Use HTTPS in production environments
- Configure a firewall to restrict access to the server
- Regularly backup the database
- Implement regular security audits and updates

## Additional Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [IIS Documentation](https://docs.microsoft.com/en-us/iis/get-started/introduction-to-iis/iis-introduction)