# Docker Management Guide

This guide explains how to use the Docker management scripts for SimpleIT Asset Management System.

## Quick Start

### Using PowerShell (Recommended)
```powershell
# Start the application
.\docker-manager.ps1 start

# Check status
.\docker-manager.ps1 status

# View logs
.\docker-manager.ps1 logs
```

### Using Batch File (Windows CMD)
```cmd
# Start the application  
docker-manager.bat start

# Check status
docker-manager.bat status

# View logs
docker-manager.bat logs
```

## Common Operations

### 🚀 Starting and Stopping

```powershell
# Start all services
.\docker-manager.ps1 start

# Start with clean slate (removes old data)
.\docker-manager.ps1 start -Clean

# Stop services
.\docker-manager.ps1 stop

# Stop and remove volumes
.\docker-manager.ps1 stop -Volumes

# Restart everything
.\docker-manager.ps1 restart
```

### 🔨 Building and Deploying

```powershell
# Build images
.\docker-manager.ps1 build

# Build without cache (recommended for releases)
.\docker-manager.ps1 build -NoCache

# Deploy (build + start)
.\docker-manager.ps1 deploy

# Update with automatic backup
.\docker-manager.ps1 update
```

### 📊 Monitoring and Debugging

```powershell
# Show detailed status
.\docker-manager.ps1 status

# Show logs (last 50 lines)
.\docker-manager.ps1 logs

# Follow logs in real-time
.\docker-manager.ps1 logs -Follow

# Show logs for specific service
.\docker-manager.ps1 logs -Service simpleit

# Run health checks
.\docker-manager.ps1 health
```

### 💾 Backup and Restore

```powershell
# Create database backup
.\docker-manager.ps1 backup

# Create backup with custom filename
.\docker-manager.ps1 backup -BackupFile "my_backup.sql"

# Restore from backup
.\docker-manager.ps1 restore -BackupFile "backup_20231222_140530.sql"
```

### 🔧 Development Tools

```powershell
# Open shell in application container
.\docker-manager.ps1 shell

# Open PostgreSQL shell
.\docker-manager.ps1 shell -Service postgres

# Open nginx shell
.\docker-manager.ps1 shell -Service nginx
```

### 🧹 Maintenance

```powershell
# Clean unused Docker resources
.\docker-manager.ps1 clean

# Clean including volumes (⚠️ deletes data!)
.\docker-manager.ps1 clean -Volumes
```

## Development Workflow

### 1. Daily Development
```powershell
# Start development environment
.\docker-manager.ps1 start

# Make code changes...

# Rebuild and restart after changes
.\docker-manager.ps1 build
.\docker-manager.ps1 restart

# Check logs if issues
.\docker-manager.ps1 logs -Follow
```

### 2. Testing Changes
```powershell
# Clean build to test from scratch
.\docker-manager.ps1 stop
.\docker-manager.ps1 build -NoCache
.\docker-manager.ps1 start -Clean

# Verify everything works
.\docker-manager.ps1 health
```

### 3. Preparing Release
```powershell
# Create backup before release
.\docker-manager.ps1 backup

# Update application
.\docker-manager.ps1 update

# Verify deployment
.\docker-manager.ps1 status
.\docker-manager.ps1 health
```

## Troubleshooting

### Application Won't Start
```powershell
# Check logs for errors
.\docker-manager.ps1 logs -Service simpleit

# Try clean restart
.\docker-manager.ps1 stop
.\docker-manager.ps1 start -Clean

# Check Docker is running
docker --version
```

### Database Issues
```powershell
# Check database logs
.\docker-manager.ps1 logs -Service postgres

# Test database connection
.\docker-manager.ps1 shell -Service postgres

# Restore from backup if corrupted
.\docker-manager.ps1 restore -BackupFile "your_backup.sql"
```

### Performance Issues
```powershell
# Check resource usage
.\docker-manager.ps1 status

# Clean unused resources
.\docker-manager.ps1 clean
```

## Access Points

- **Main Application**: http://localhost
- **Health Check**: http://localhost/api/health
- **Database**: localhost:5432 (user: simpleit, pass: simpleit)

## File Structure

```
├── docker-manager.ps1      # Main PowerShell script
├── docker-manager.bat      # Windows batch wrapper
├── docker-compose.yml      # Docker services definition
├── Dockerfile             # Application image definition
├── nginx.conf             # Nginx configuration
└── scripts/
    └── 01-init-database.sql # Database initialization
```

## Environment Variables

The application uses these environment variables (configured in docker-compose.yml):

- `NODE_ENV=production`
- `PORT=5000`
- `DATABASE_URL=postgres://simpleit:simpleit@postgres:5432/simpleit`
- `SESSION_SECRET=auto-generated`

## Tips

1. **Always backup** before major updates
2. **Use -Clean flag** when having strange issues
3. **Check logs first** when troubleshooting
4. **Use health checks** to verify deployment
5. **Clean resources regularly** to free disk space

## Getting Help

```powershell
# Show all available commands
.\docker-manager.ps1 help

# Show Docker status
docker-compose ps

# Show Docker system info
docker system df
```