# SimpleIT Asset Management System - Deployment Guide

This guide provides comprehensive deployment instructions for the SimpleIT Asset Management System across multiple platforms and environments.

## Overview

SimpleIT is a production-ready IT asset management system designed for ELADWYSOFT company with comprehensive role-based access control, asset tracking, ticketing system, and audit capabilities.

## Deployment Options

### 1. Docker Deployment (Recommended for Development)

**Prerequisites:**
- Docker and Docker Compose installed
- 4GB RAM minimum
- 10GB disk space

**Quick Start:**
```bash
# Make the script executable
chmod +x deploy-docker.sh

# Run deployment
./deploy-docker.sh
```

**What it includes:**
- PostgreSQL 15 database
- SimpleIT application container
- Automated health checks
- Volume persistence for data
- Network configuration

**Access:**
- Application: http://localhost:5000
- Database: localhost:5432
- Default Login: admin / admin123

### 2. Ubuntu Server Deployment (Recommended for Production)

**Prerequisites:**
- Ubuntu 20.04 LTS or 22.04 LTS
- Sudo privileges
- 4GB RAM minimum
- 20GB disk space

**Deployment:**
```bash
# Make the script executable
chmod +x deploy-ubuntu-server.sh

# Run deployment
./deploy-ubuntu-server.sh
```

**What it includes:**
- Node.js 18 installation
- PostgreSQL 15 with optimized configuration
- PM2 process management
- Nginx reverse proxy
- SSL-ready configuration
- Systemd service integration
- UFW firewall configuration

**Access:**
- Application: http://your-server-ip
- Database: localhost:5432 (internal)
- Default Login: admin / admin123

### 3. Windows Server Deployment

**Prerequisites:**
- Windows Server 2019/2022 or Windows 10/11
- Administrator privileges
- PowerShell execution policy set to RemoteSigned

**Deployment:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run deployment
.\deploy-windows.ps1
```

**What it includes:**
- Chocolatey package manager
- Node.js 18 installation
- PostgreSQL 15 installation
- PM2 process management
- Windows Service configuration
- Windows Firewall rules

**Access:**
- Application: http://localhost:5000
- Database: localhost:5432
- Default Login: admin / admin123

### 4. Vagrant Development Environment

**Prerequisites:**
- VirtualBox installed
- Vagrant installed
- 8GB RAM recommended

**Setup:**
```bash
# Start the development environment
vagrant up

# SSH into the environment
vagrant ssh

# Start the application
cd /opt/simpleit
pm2 start ecosystem.config.js
```

**What it includes:**
- Ubuntu 22.04 LTS virtual machine
- Complete development environment
- File synchronization with host
- Port forwarding for easy access

**Access:**
- Application: http://localhost:5000
- SSH: vagrant ssh
- Database: localhost:5432

## Post-Deployment Configuration

### 1. Initial System Setup

After deployment, access the application and:

1. Login with admin credentials (admin / admin123)
2. Navigate to System Configuration
3. Update company information
4. Configure email settings for notifications
5. Set up departments and asset categories
6. Create user accounts and assign roles

### 2. Security Hardening

**Change Default Passwords:**
```bash
# For database
sudo -u postgres psql
ALTER USER simpleit_user PASSWORD 'your-secure-password';

# Update environment file
vim .env
# Change DATABASE_URL and SESSION_SECRET
```

**SSL Configuration (Ubuntu/Production):**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Backup Configuration

**Database Backup (Automated):**
```bash
# Create backup script
cat > /opt/simpleit/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/simpleit/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U simpleit_user -h localhost simpleit > $BACKUP_DIR/simpleit_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /opt/simpleit/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /opt/simpleit/backup.sh
```

## Environment Variables

Key environment variables for configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGDATABASE=simpleit
PGUSER=simpleit_user
PGPASSWORD=your-password

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-session-secret

# Email Configuration (Optional)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
```

## Monitoring and Maintenance

### Application Monitoring

**PM2 Monitoring:**
```bash
# View application status
pm2 status

# View logs
pm2 logs simpleit

# Monitor resources
pm2 monit

# Restart application
pm2 restart simpleit
```

**System Monitoring:**
```bash
# Check system resources
htop

# Check disk usage
df -h

# Check database status
sudo systemctl status postgresql
```

### Database Maintenance

**Regular Maintenance:**
```bash
# Connect to database
psql -U simpleit_user -d simpleit

# Analyze tables
ANALYZE;

# Vacuum database
VACUUM;

# Check database size
SELECT pg_size_pretty(pg_database_size('simpleit'));
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Check what's using port 5000
sudo netstat -tulpn | grep :5000

# Kill the process
sudo kill -9 <process_id>
```

**Database Connection Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check configuration
sudo -u postgres psql -c "SELECT version();"
```

**Application Won't Start:**
```bash
# Check logs
pm2 logs simpleit

# Check environment variables
cat .env

# Restart with fresh logs
pm2 delete simpleit
pm2 start ecosystem.config.js
```

### Log Locations

- **Application Logs:** `/opt/simpleit/logs/`
- **PostgreSQL Logs:** `/var/log/postgresql/`
- **Nginx Logs:** `/var/log/nginx/`
- **System Logs:** `/var/log/syslog`

## Performance Optimization

### Database Optimization

```sql
-- Optimize PostgreSQL for SimpleIT
-- Add to postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Application Optimization

```bash
# Enable compression in Nginx
# Add to /etc/nginx/sites-available/simpleit

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Review application logs
   - Check disk usage
   - Verify backup integrity

2. **Monthly:**
   - Update system packages
   - Review security logs
   - Performance analysis

3. **Quarterly:**
   - Security audit
   - Database optimization
   - Backup strategy review

### Upgrade Procedure

```bash
# 1. Backup current system
./backup.sh

# 2. Stop application
pm2 stop simpleit

# 3. Update code
git pull origin main
npm install

# 4. Run migrations
npm run db:push

# 5. Restart application
pm2 restart simpleit
```

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Nginx        │    │   SimpleIT App   │    │   PostgreSQL    │
│  (Reverse Proxy)│◄──►│   (Node.js)      │◄──►│   (Database)    │
│  Port 80/443    │    │   Port 5000      │    │   Port 5432     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │  SSL    │             │   PM2   │             │ Backups │
    │ Certs   │             │ Process │             │  & Logs │
    └─────────┘             │ Manager │             └─────────┘
                            └─────────┘
```

## Security Considerations

1. **Network Security:**
   - Use UFW/Windows Firewall
   - Restrict database access to localhost
   - Enable HTTPS with SSL certificates

2. **Application Security:**
   - Change default passwords
   - Use strong session secrets
   - Regular security updates

3. **Data Security:**
   - Encrypted database connections
   - Regular backups
   - Access logging and monitoring

## Contact and Support

For deployment assistance or issues:
- Review application logs first
- Check this deployment guide
- Verify environment configuration
- Ensure all prerequisites are met

This deployment guide ensures a production-ready SimpleIT installation with comprehensive security, monitoring, and maintenance procedures.