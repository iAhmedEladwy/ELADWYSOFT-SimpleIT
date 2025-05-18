# SimpleIT Deployment Guide

This guide provides various deployment options for the SimpleIT Asset Management System.

## Deployment Options

### 1. Ubuntu/Debian Deployment

For Ubuntu 22.04, Ubuntu 24.04, or Debian-based distributions with Node.js 22:

```bash
# Make the script executable
chmod +x docs/deploy-ubuntu.sh

# Run the script with sudo
sudo ./docs/deploy-ubuntu.sh
```

This script will:
- Install required dependencies (Node.js 22, PostgreSQL)
- Set up a PostgreSQL database
- Clone the application repository
- Configure environment variables
- Create a systemd service
- Start the application

### 2. Universal Linux Deployment

For multiple Linux distributions including Ubuntu/Debian, CentOS/RHEL/Fedora, and Arch Linux:

```bash
# Make the script executable
chmod +x docs/deploy-universal.sh

# Run the script with sudo
sudo ./docs/deploy-universal.sh
```

This script provides more flexibility and automatically detects your distribution to install the appropriate dependencies.

### 3. Windows Deployment

For Windows Server or Windows 10/11 with PowerShell:

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the Windows deployment script:

```powershell
# Set execution policy to allow scripts (if needed)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Run the deployment script
.\docs\deploy-windows.ps1
```

This script will:
- Install required software (Node.js 22, PostgreSQL, Git) using Chocolatey
- Set up a PostgreSQL database
- Clone the application repository
- Configure environment variables
- Create a Windows service using NSSM
- Start the service

### 4. Docker Deployment

For a containerized deployment using Docker and Docker Compose:

1. Navigate to the project directory:
```bash
cd /path/to/simpleit
```

2. Copy the Docker files to your project:
```bash
cp docs/docker-compose.yml .
cp docs/Dockerfile .
mkdir -p nginx
cp docs/nginx/default.conf nginx/
```

3. Create an SSL directory if using HTTPS:
```bash
mkdir -p nginx/ssl
```

4. Start the containers:
```bash
docker-compose up -d
```

The application will be available at http://localhost:3000 or http://your-server-ip:3000.

## Post-Deployment

After deploying, you should:

1. **Configure HTTPS**: In production, always configure HTTPS using Let's Encrypt or your own SSL certificates.

2. **Update Default Passwords**: Change the default PostgreSQL password and other credentials.

3. **Configure Backups**: Set up regular database backups.

4. **Monitoring**: Consider adding monitoring for the application (e.g., using Prometheus/Grafana).

## Troubleshooting

### Checking Service Status

```bash
# Check service status
sudo systemctl status simpleit

# View logs
sudo journalctl -u simpleit -f
```

### Docker Issues

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f app
```

### Database Issues

```bash
# Connect to PostgreSQL
sudo -u postgres psql simpleit

# Check database connection from application
docker exec -it simpleit-app node -e "const { Pool } = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()', (err, res) => { console.log(err, res); pool.end(); });"
```

## Updating the Application

### Standard Deployment

```bash
cd /opt/simpleit
git pull
npm install
npm run build
sudo systemctl restart simpleit
```

### Docker Deployment

```bash
docker-compose pull
docker-compose down
docker-compose up -d
```