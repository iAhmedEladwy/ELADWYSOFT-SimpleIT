# SimpleIT Docker Management Script - Windows Compatible Version
# Author: GitHub Copilot
# Description: Comprehensive Docker management for SimpleIT Asset Management System
# Usage: .\docker-manager-simple.ps1 [command] [options]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "build", "deploy", "update", "logs", "status", "clean", "backup", "restore", "shell", "health", "help")]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Version = "latest",
    
    [switch]$Clean = $false,
    [switch]$NoCache = $false,
    [switch]$Follow = $false,
    [switch]$Volumes = $false,
    [string]$BackupFile = "",
    [string]$Service = "all"
)

# Configuration
$PROJECT_NAME = "simpleit"
$COMPOSE_FILE = "docker-compose.yml"
$IMAGE_NAME = "eladwysoft-simpleit-simpleit"
$HEALTH_URL = "http://localhost/api/health"

# Helper Functions
function Write-Status($Message, $Type = "INFO") {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    switch ($Type) {
        "SUCCESS" { Write-Host "[$timestamp] [SUCCESS] $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[$timestamp] [ERROR] $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[$timestamp] [WARNING] $Message" -ForegroundColor Yellow }
        "INFO"    { Write-Host "[$timestamp] [INFO] $Message" -ForegroundColor Cyan }
        default   { Write-Host "[$timestamp] $Message" -ForegroundColor White }
    }
}

function Write-Section($Title) {
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Blue
    Write-Host ("-" * 50) -ForegroundColor DarkGray
}

function Test-Prerequisites {
    # Check Docker
    try {
        docker info *> $null
        if ($LASTEXITCODE -ne 0) { throw "Docker not running" }
    } catch {
        Write-Status "Docker is not running. Please start Docker Desktop." "ERROR"
        return $false
    }
    
    # Check docker-compose file
    if (-not (Test-Path $COMPOSE_FILE)) {
        Write-Status "docker-compose.yml not found in current directory." "ERROR"
        return $false
    }
    
    return $true
}

function Wait-ForApplication($MaxWait = 60) {
    Write-Status "Waiting for application to be ready..." "INFO"
    
    for ($i = 1; $i -le $MaxWait; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $HEALTH_URL -UseBasicParsing -TimeoutSec 3 2>$null
            if ($response.StatusCode -eq 200) {
                Write-Status "Application is ready!" "SUCCESS"
                return $true
            }
        } catch {
            # Continue waiting
        }
        
        if ($i % 5 -eq 0) {
            Write-Host "." -NoNewline
        }
        Start-Sleep 1
    }
    
    Write-Host ""
    Write-Status "Application may not be ready yet. Check logs if needed." "WARNING"
    return $false
}

# Main Commands
switch ($Command.ToLower()) {
    "start" {
        Write-Section "Starting SimpleIT Services"
        
        if (-not (Test-Prerequisites)) { exit 1 }
        
        if ($Clean) {
            Write-Status "Clean start requested - removing existing containers and volumes" "WARNING"
            docker-compose down -v
        }
        
        Write-Status "Starting services..." "INFO"
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Services started successfully" "SUCCESS"
            Wait-ForApplication
            Write-Status "Access your application at: http://localhost" "INFO"
        } else {
            Write-Status "Failed to start services" "ERROR"
        }
    }
    
    "stop" {
        Write-Section "Stopping SimpleIT Services"
        
        if ($Volumes) {
            Write-Status "Stopping services and removing volumes" "WARNING"
            docker-compose down -v
        } else {
            Write-Status "Stopping services..." "INFO"
            docker-compose down
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Services stopped successfully" "SUCCESS"
        } else {
            Write-Status "Failed to stop services" "ERROR"
        }
    }
    
    "restart" {
        Write-Section "Restarting SimpleIT Services"
        
        Write-Status "Stopping services..." "INFO"
        docker-compose down
        Start-Sleep 2
        
        Write-Status "Starting services..." "INFO"
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Services restarted successfully" "SUCCESS"
            Wait-ForApplication
        } else {
            Write-Status "Failed to restart services" "ERROR"
        }
    }
    
    "build" {
        Write-Section "Building SimpleIT Images"
        
        if (-not (Test-Prerequisites)) { exit 1 }
        
        $buildArgs = @("docker-compose", "build")
        
        if ($NoCache) {
            $buildArgs += "--no-cache"
            Write-Status "Building with no cache..." "INFO"
        }
        
        if ($Service -ne "all") {
            $buildArgs += $Service
            Write-Status "Building service: $Service" "INFO"
        }
        
        & $buildArgs[0] $buildArgs[1..($buildArgs.Length-1)]
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Build completed successfully" "SUCCESS"
        } else {
            Write-Status "Build failed" "ERROR"
        }
    }
    
    "deploy" {
        Write-Section "Deploying SimpleIT Application"
        
        if (-not (Test-Prerequisites)) { exit 1 }
        
        Write-Status "Building images..." "INFO"
        docker-compose build
        
        Write-Status "Starting services..." "INFO"
        docker-compose down
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Deployment started" "SUCCESS"
            if (Wait-ForApplication) {
                Write-Status "Deployment completed successfully!" "SUCCESS"
                Write-Status "Application is available at: http://localhost" "INFO"
            }
        } else {
            Write-Status "Deployment failed" "ERROR"
        }
    }
    
    "update" {
        Write-Section "Updating SimpleIT Application"
        
        if (-not (Test-Prerequisites)) { exit 1 }
        
        Write-Status "Creating backup before update..." "INFO"
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "backup_before_update_$timestamp.sql"
        
        docker-compose exec -T postgres pg_dump -U simpleit simpleit > $backupFile 2>$null
        if (Test-Path $backupFile) {
            Write-Status "Backup created: $backupFile" "SUCCESS"
        }
        
        Write-Status "Rebuilding application..." "INFO"
        docker-compose build --no-cache
        docker-compose down
        docker-compose up -d
        
        if (Wait-ForApplication) {
            Write-Status "Update completed successfully!" "SUCCESS"
        } else {
            Write-Status "Update may have issues. Check logs." "WARNING"
        }
    }
    
    "logs" {
        Write-Section "Showing Logs"
        
        $logArgs = @("docker-compose", "logs")
        
        if ($Follow) {
            $logArgs += "-f"
        }
        
        $logArgs += "--tail", "50"
        
        if ($Service -ne "all") {
            $logArgs += $Service
            Write-Status "Showing logs for service: $Service" "INFO"
        } else {
            Write-Status "Showing logs for all services" "INFO"
        }
        
        & $logArgs[0] $logArgs[1..($logArgs.Length-1)]
    }
    
    "status" {
        Write-Section "SimpleIT Services Status"
        
        Write-Status "Container Status:" "INFO"
        docker-compose ps
        
        Write-Host ""
        Write-Status "Health Check:" "INFO"
        try {
            $health = Invoke-RestMethod -Uri $HEALTH_URL -TimeoutSec 5
            Write-Status "Application is healthy" "SUCCESS"
            Write-Host "  Status: $($health.status)" -ForegroundColor Green
            Write-Host "  Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Green
            Write-Host "  Timestamp: $($health.timestamp)" -ForegroundColor Green
        } catch {
            Write-Status "Health check failed - application may be starting" "WARNING"
        }
        
        Write-Host ""
        Write-Status "Resource Usage:" "INFO"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    }
    
    "clean" {
        Write-Section "Cleaning Docker Environment"
        
        Write-Status "This will remove stopped containers, unused networks, and unused images" "WARNING"
        $confirm = Read-Host "Are you sure? (y/N)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Status "Stopping SimpleIT services..." "INFO"
            docker-compose down
            
            Write-Status "Cleaning containers..." "INFO"
            docker container prune -f
            
            Write-Status "Cleaning networks..." "INFO"
            docker network prune -f
            
            Write-Status "Cleaning images..." "INFO"
            docker image prune -f
            
            if ($Volumes) {
                Write-Status "Cleaning volumes (this will delete data!)..." "WARNING"
                docker volume prune -f
            }
            
            Write-Status "Cleanup completed" "SUCCESS"
        } else {
            Write-Status "Cleanup cancelled" "INFO"
        }
    }
    
    "backup" {
        Write-Section "Creating Database Backup"
        
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = if ($BackupFile) { $BackupFile } else { "backup_$timestamp.sql" }
        
        Write-Status "Creating backup: $backupFile" "INFO"
        
        docker-compose exec -T postgres pg_dump -U simpleit simpleit > $backupFile
        
        if ($LASTEXITCODE -eq 0 -and (Test-Path $backupFile)) {
            $size = [math]::Round((Get-Item $backupFile).Length / 1KB, 2)
            Write-Status "Backup created successfully: $backupFile ($size KB)" "SUCCESS"
        } else {
            Write-Status "Backup failed" "ERROR"
        }
    }
    
    "restore" {
        Write-Section "Restoring Database"
        
        if (-not $BackupFile) {
            Write-Status "Please specify backup file with -BackupFile parameter" "ERROR"
            exit 1
        }
        
        if (-not (Test-Path $BackupFile)) {
            Write-Status "Backup file not found: $BackupFile" "ERROR"
            exit 1
        }
        
        Write-Status "This will replace all existing data!" "WARNING"
        $confirm = Read-Host "Are you sure? (y/N)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Status "Restoring from: $BackupFile" "INFO"
            
            docker-compose exec -T postgres psql -U simpleit -c "DROP DATABASE IF EXISTS simpleit;"
            docker-compose exec -T postgres psql -U simpleit -c "CREATE DATABASE simpleit;"
            Get-Content $BackupFile | docker-compose exec -T postgres psql -U simpleit simpleit
            
            if ($LASTEXITCODE -eq 0) {
                Write-Status "Database restored successfully" "SUCCESS"
            } else {
                Write-Status "Restore failed" "ERROR"
            }
        } else {
            Write-Status "Restore cancelled" "INFO"
        }
    }
    
    "shell" {
        Write-Section "Opening Shell"
        
        $targetService = if ($Service -eq "all") { "simpleit" } else { $Service }
        
        Write-Status "Opening shell in $targetService container..." "INFO"
        
        switch ($targetService) {
            "simpleit" { docker-compose exec simpleit sh }
            "postgres" { docker-compose exec postgres psql -U simpleit simpleit }
            "nginx" { docker-compose exec nginx sh }
            default { 
                Write-Status "Invalid service. Choose from: simpleit, postgres, nginx" "ERROR"
                exit 1
            }
        }
    }
    
    "health" {
        Write-Section "Health Check"
        
        try {
            Write-Status "Testing application health..." "INFO"
            $health = Invoke-RestMethod -Uri $HEALTH_URL -TimeoutSec 10
            
            Write-Status "Application is healthy!" "SUCCESS"
            Write-Host "Status: $($health.status)" -ForegroundColor Green
            Write-Host "Uptime: $([math]::Round($health.uptime, 2)) seconds" -ForegroundColor Green
            Write-Host "Timestamp: $($health.timestamp)" -ForegroundColor Green
            
            Write-Status "Testing database connection..." "INFO"
            docker-compose exec -T postgres psql -U simpleit -d simpleit -c "SELECT 1;" > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Status "Database connection is working" "SUCCESS"
            } else {
                Write-Status "Database connection test failed" "WARNING"
            }
            
        } catch {
            Write-Status "Health check failed: $($_.Exception.Message)" "ERROR"
            Write-Status "Check if the application is running with: .\docker-manager-simple.ps1 status" "INFO"
        }
    }
    
    "help" {
        Write-Section "SimpleIT Docker Manager - Help"
        
        Write-Host @"
USAGE:
    .\docker-manager-simple.ps1 <command> [options]

COMMANDS:
    start       Start all services
    stop        Stop all services  
    restart     Restart all services
    build       Build Docker images
    deploy      Deploy application (build + start)
    update      Update application with backup
    logs        Show service logs
    status      Show detailed status
    clean       Clean Docker environment
    backup      Create database backup
    restore     Restore database from backup
    shell       Open shell in container
    health      Run health checks
    help        Show this help

OPTIONS:
    -Version <version>      Specify version (default: latest)
    -Clean                  Clean start (remove volumes)
    -NoCache               Build without cache
    -Follow                Follow logs in real-time
    -Volumes               Include volumes in operations
    -BackupFile <file>     Specify backup file
    -Service <name>        Target specific service

EXAMPLES:
    .\docker-manager-simple.ps1 start                    # Start all services
    .\docker-manager-simple.ps1 start -Clean             # Clean start
    .\docker-manager-simple.ps1 logs -Follow             # Follow logs
    .\docker-manager-simple.ps1 logs -Service simpleit   # Show app logs only
    .\docker-manager-simple.ps1 build -NoCache           # Build without cache
    .\docker-manager-simple.ps1 backup                   # Create backup
    .\docker-manager-simple.ps1 restore -BackupFile backup.sql
    .\docker-manager-simple.ps1 shell -Service postgres  # Open DB shell
    .\docker-manager-simple.ps1 clean -Volumes           # Clean including volumes

ACCESS POINTS:
    Application:  http://localhost
    Health:       http://localhost/api/health
    Database:     localhost:5432 (simpleit/simpleit)

QUICK START:
    1. .\docker-manager-simple.ps1 start
    2. Open http://localhost in your browser
    3. .\docker-manager-simple.ps1 status (to check everything is running)
"@
    }
    
    default {
        Write-Status "Unknown command: $Command" "ERROR"
        Write-Status "Use 'help' to see available commands" "INFO"
        exit 1
    }
}