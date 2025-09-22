# 🚀 SimpleIT Docker Quick Reference

## 📋 Management Scripts Created

1. **docker-manager-simple.ps1** - ✅ Main management script (recommended)
2. **docker-manager.ps1** - Advanced version (has emoji issues on some systems)
3. **docker-manager.bat** - Batch wrapper for easy access
4. **DOCKER-README.md** - Complete documentation

## ⚡ Quick Commands

```powershell
# Essential Commands
.\docker-manager-simple.ps1 start          # Start everything
.\docker-manager-simple.ps1 status         # Check status
.\docker-manager-simple.ps1 health         # Health check
.\docker-manager-simple.ps1 stop           # Stop everything

# Development Workflow
.\docker-manager-simple.ps1 build          # Build images
.\docker-manager-simple.ps1 restart        # Restart services
.\docker-manager-simple.ps1 logs           # View logs
.\docker-manager-simple.ps1 logs -Follow   # Follow logs live

# Maintenance
.\docker-manager-simple.ps1 backup         # Create backup
.\docker-manager-simple.ps1 update         # Update with backup
.\docker-manager-simple.ps1 clean          # Clean unused resources
```

## 🔧 When Code Changes

### Quick Update (for small changes):
```powershell
.\docker-manager-simple.ps1 build
.\docker-manager-simple.ps1 restart
```

### Full Update (recommended for releases):
```powershell
.\docker-manager-simple.ps1 update
```

### Clean Rebuild (for major changes):
```powershell
.\docker-manager-simple.ps1 stop -Volumes
.\docker-manager-simple.ps1 build -NoCache
.\docker-manager-simple.ps1 start -Clean
```

## 🌐 Access Points

- **Application**: http://localhost
- **Health Check**: http://localhost/api/health
- **Database**: localhost:5432 (user: simpleit, pass: simpleit)

## 🆘 Troubleshooting

```powershell
# Check what's wrong
.\docker-manager-simple.ps1 status
.\docker-manager-simple.ps1 logs

# Fix common issues
.\docker-manager-simple.ps1 restart
.\docker-manager-simple.ps1 start -Clean

# Nuclear option (deletes data!)
.\docker-manager-simple.ps1 clean -Volumes
```

## 📁 File Structure

```
├── docker-manager-simple.ps1   # ✅ Main script (use this)
├── docker-manager.ps1          # Advanced version
├── docker-manager.bat          # Batch wrapper
├── DOCKER-README.md            # Full documentation
├── docker-compose.yml          # Services definition
├── Dockerfile                  # App container definition
├── nginx.conf                  # Proxy configuration
└── scripts/
    └── 01-init-database.sql    # DB initialization
```

## 💡 Pro Tips

1. **Always backup before updates**: `.\docker-manager-simple.ps1 backup`
2. **Use -Clean for fresh starts**: `.\docker-manager-simple.ps1 start -Clean`
3. **Monitor with status**: `.\docker-manager-simple.ps1 status`
4. **Follow logs for debugging**: `.\docker-manager-simple.ps1 logs -Follow`
5. **Health check after changes**: `.\docker-manager-simple.ps1 health`

---
**Your SimpleIT Docker deployment is ready! 🎉**