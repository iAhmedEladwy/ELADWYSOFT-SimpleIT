# SimpleIT Asset Management System - Deployment Guide

This comprehensive guide provides detailed instructions for deploying the SimpleIT Asset Management System in various environments with multiple deployment options.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
  - [Docker Deployment (Recommended)](#docker-deployment-recommended)
  - [Ubuntu/Debian Deployment](#ubuntudebian-deployment)
  - [Windows Deployment](#windows-deployment)
- [Post-Deployment Steps](#post-deployment-steps)
- [Troubleshooting](#troubleshooting)
- [Backup and Restore](#backup-and-restore)
- [Updating the Application](#updating-the-application)

## Prerequisites

### Hardware Requirements

* **CPU**: 2+ cores recommended
* **RAM**: Minimum 2GB, 4GB+ recommended
* **Storage**: At least 2GB of free disk space
* **Network**: Internet connection required for initial setup

### Software Requirements

For all deployment methods:
* **Git**: Required to clone the repository
  * [Download Git](https://git-scm.com/downloads)

For Docker Deployment:
* **Docker**: Version 20.10.x or higher
  * [Download Docker](https://www.docker.com/get-started/)
* **Docker Compose**: Version 2.x or higher (included with Docker Desktop on Windows/macOS)
  * [Docker Compose Installation](https://docs.docker.com/compose/install/)

For Ubuntu/Debian Deployment:
* **Ubuntu 22.04/24.04 LTS** or **Debian 11/12**
* **Node.js**: Version 18 LTS (installed by the deployment script)
* **PostgreSQL**: Version 14 or higher (installed by the deployment script)

For Windows Deployment:
* **Windows 10/11** or **Windows Server 2019/2022**
* **PowerShell**: Version 5.1 or higher
* **Chocolatey**: Package manager (installed by the deployment script)
* **Node.js**: Version 18 LTS (installed by the deployment script)
* **PostgreSQL**: Version 14 or higher (installed by the deployment script)

## Deployment Options

### Docker Deployment (Recommended)

Docker deployment is the recommended method as it:
- Requires minimal setup and configuration
- Ensures consistent environment across platforms
- Simplifies future updates and maintenance

#### Step 1: Clone the Repository

```bash
git clone https://github.com/eladwysoft/simpleit.git
cd simpleit
```

#### Step 2: Create Docker Configuration Files

```bash
# Copy improved Docker files
cp docs/Dockerfile.fixed ./Dockerfile
cp docs/docker-compose.yml.fixed ./docker-compose.yml
mkdir -p nginx
cp docs/nginx/default.conf.fixed ./nginx/default.conf
```

#### Step 3: Set Environment Variables

```bash
# Generate secure passwords
export DB_PASSWORD=$(openssl rand -base64 16)
export SESSION_SECRET=$(openssl rand -base64 32)

# Save for later reference (optional)
echo "DB_PASSWORD: $DB_PASSWORD" > credentials.txt
echo "SESSION_SECRET: $SESSION_SECRET" >> credentials.txt
chmod 600 credentials.txt
```

#### Step 4: Start Docker Containers

```bash
# Start the containers in detached mode
docker-compose up -d
```

#### Step 5: Verify Deployment

Wait for the containers to initialize (this may take a few minutes), then check if they're running:

```bash
docker-compose ps
```

Access the application in your browser at:
- http://localhost (or your server IP address)

Default login credentials:
- Username: `admin`
- Password: `admin123`

### Ubuntu/Debian Deployment

For direct installation on Ubuntu or Debian systems:

#### Step 1: Clone the Repository

```bash
git clone https://github.com/eladwysoft/simpleit.git
cd simpleit
```

#### Step 2: Run the Deployment Script

```bash
# Make the script executable
chmod +x docs/deploy-ubuntu-fixed.sh

# Run the script with sudo
sudo ./docs/deploy-ubuntu-fixed.sh
```

The script will:
- Install required dependencies (Node.js, PostgreSQL)
- Set up a PostgreSQL database
- Configure the application
- Create a systemd service
- Configure Nginx as a reverse proxy
- Start the application

#### Step 3: Verify Deployment

Access the application in your browser at:
- http://localhost (or your server IP address)

Default login credentials:
- Username: `admin`
- Password: `admin123`

Check service status:
```bash
sudo systemctl status simpleit
```

### Windows Deployment

For installation on Windows servers:

#### Step 1: Prepare Your Environment

1. Open PowerShell as Administrator
2. Navigate to where you want to install SimpleIT

#### Step 2: Clone the Repository

```powershell
git clone https://github.com/eladwysoft/simpleit.git
cd simpleit
```

#### Step 3: Run the Deployment Script

```powershell
# Set execution policy to allow scripts (if needed)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Run the deployment script
.\docs\deploy-windows-fixed.ps1
```

The script will:
- Install Chocolatey package manager (if not already installed)
- Install Node.js, Git, PostgreSQL, and NSSM
- Configure the PostgreSQL database
- Build the application
- Create a Windows service
- Start the application

#### Step 4: Verify Deployment

Access the application in your browser at:
- http://localhost:3000 (or your server IP address)

Default login credentials:
- Username: `admin`
- Password: `admin123`

Check service status:
```powershell
Get-Service -Name SimpleIT
```

## Post-Deployment Steps

After successful deployment, consider the following important steps:

### 1. Change Default Credentials

For security reasons, change the default admin password immediately after first login:
1. Login with the default credentials
2. Go to Profile > Change Password
3. Set a strong password

### 2. Configure Security Questions

Set up security questions for account recovery:
1. Go to Profile > Security Questions
2. Set up at least 3 security questions

### 3. Configure HTTPS

For production environments, always use HTTPS:

#### For Docker/Ubuntu with Nginx:

```bash
# Ubuntu: Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d yourdomain.com
```

#### For Windows with IIS:

1. Install IIS URL Rewrite Module
2. Configure URL Rewrite to redirect HTTP to HTTPS
3. Add SSL certificate through IIS Manager

### 4. Set Up Database Backups

#### For Docker:

```bash
# Create backup script
cat > backup.sh << 'EOL'
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U simpleituser simpleit > $BACKUP_DIR/simpleit_db_$DATE.sql
tar -czvf $BACKUP_DIR/simpleit_uploads_$DATE.tar.gz ./uploads
EOL

chmod +x backup.sh

# Set up cron job for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup.sh") | crontab -
```

#### For Ubuntu:

```bash
# Create backup script
sudo bash -c 'cat > /usr/local/bin/simpleit-backup.sh << "EOL"
#!/bin/bash
BACKUP_DIR="/var/backups/simpleit"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump simpleit > $BACKUP_DIR/simpleit_db_$DATE.sql
tar -czvf $BACKUP_DIR/simpleit_uploads_$DATE.tar.gz /opt/simpleit/uploads
find $BACKUP_DIR -name "simpleit_db_*" -mtime +30 -delete
find $BACKUP_DIR -name "simpleit_uploads_*" -mtime +30 -delete
EOL'

sudo chmod +x /usr/local/bin/simpleit-backup.sh

# Set up cron job for daily backups at 2 AM
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/simpleit-backup.sh") | sudo crontab -
```

#### For Windows:

Create a PowerShell script for backups and schedule it using Task Scheduler.

## Troubleshooting

### Common Issues and Solutions

#### Docker Deployment

**Issue**: Container keeps restarting
**Solution**: Check container logs for errors
```bash
docker-compose logs app
```

**Issue**: Database connection failure
**Solution**: Ensure PostgreSQL container is healthy
```bash
docker-compose ps postgres
docker-compose logs postgres
```

#### Ubuntu Deployment

**Issue**: Service fails to start
**Solution**: Check logs for errors
```bash
sudo journalctl -u simpleit -f
```

**Issue**: Cannot connect to PostgreSQL
**Solution**: Verify PostgreSQL is running and accessible
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l" # List databases
```

#### Windows Deployment

**Issue**: Service fails to start
**Solution**: Check Windows Event Viewer and service logs
```powershell
Get-EventLog -LogName Application -Source "SimpleIT" -Newest 20
# Or check the error log file
cat C:\SimpleIT\error.log
```

**Issue**: Port binding error
**Solution**: Check if port 3000 is already in use
```powershell
netstat -ano | findstr :3000
# If in use, change the port in .env file
```

### Diagnosing Network Issues

#### Error connecting to port 433

This error typically occurs when:
1. The application is trying to connect via HTTPS but no SSL certificate is configured
2. Firewall is blocking the connection

**Solution**:
- Check if SSL is properly configured in Nginx
- Ensure port 443 is open in your firewall
- If SSL is not needed, update the configuration to use HTTP only

```bash
# Check Nginx configuration
sudo nginx -t

# Check firewall status
sudo ufw status

# Open port if needed
sudo ufw allow 443/tcp
```

## Backup and Restore

### Creating Manual Backups

#### For Docker:

```bash
# Backup database
docker-compose exec postgres pg_dump -U simpleituser simpleit > simpleit_backup_$(date +%Y%m%d).sql

# Backup uploaded files
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads
```

#### For Ubuntu:

```bash
# Backup database
sudo -u postgres pg_dump simpleit > simpleit_backup_$(date +%Y%m%d).sql

# Backup uploaded files
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz /opt/simpleit/uploads
```

#### For Windows:

```powershell
# Backup database
& 'C:\Program Files\PostgreSQL\14\bin\pg_dump.exe' -U simpleit simpleit > simpleit_backup_$(Get-Date -Format "yyyyMMdd").sql

# Backup uploaded files
Compress-Archive -Path C:\SimpleIT\uploads -DestinationPath uploads_backup_$(Get-Date -Format "yyyyMMdd").zip
```

### Restoring from Backup

#### For Docker:

```bash
# Restore database
cat simpleit_backup_YYYYMMDD.sql | docker-compose exec -T postgres psql -U simpleituser simpleit

# Restore uploaded files
tar -xzvf uploads_backup_YYYYMMDD.tar.gz
```

#### For Ubuntu:

```bash
# Restore database
sudo -u postgres psql simpleit < simpleit_backup_YYYYMMDD.sql

# Restore uploaded files
tar -xzvf uploads_backup_YYYYMMDD.tar.gz -C /opt/simpleit/
sudo chown -R simpleit:simpleit /opt/simpleit/uploads
```

#### For Windows:

```powershell
# Restore database
Get-Content simpleit_backup_YYYYMMDD.sql | & 'C:\Program Files\PostgreSQL\14\bin\psql.exe' -U simpleit simpleit

# Restore uploaded files
Expand-Archive -Path uploads_backup_YYYYMMDD.zip -DestinationPath C:\SimpleIT\
```

## Updating the Application

### Docker Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up --build -d

# Apply database migrations
docker-compose exec app npm run db:push
```

### Ubuntu Deployment

```bash
# Pull latest changes
cd /opt/simpleit
sudo -u simpleit git pull origin main

# Install dependencies and rebuild
sudo -u simpleit npm install --omit=dev
sudo -u simpleit npm run build

# Apply database migrations
sudo -u simpleit npm run db:push

# Restart service
sudo systemctl restart simpleit
```

### Windows Deployment

```powershell
# Pull latest changes
cd C:\SimpleIT
git pull origin main

# Install dependencies and rebuild
npm install --omit=dev
npm run build

# Apply database migrations
npm run db:push

# Restart service
nssm restart SimpleIT
```

---

For additional support or questions, please contact the SimpleIT team at support@eladwysoft.com or create an issue on our GitHub repository.

Last updated: 2024-05