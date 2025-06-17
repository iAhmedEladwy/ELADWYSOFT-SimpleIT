# SimpleIT Asset Management System - Windows Deployment Script
# This script deploys the SimpleIT system on Windows with PostgreSQL

param(
    [switch]$SkipDependencies,
    [string]$InstallPath = "C:\SimpleIT"
)

Write-Host "🚀 Starting SimpleIT Windows Deployment..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

# Function to check if a command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Install Chocolatey if not present
if (-not $SkipDependencies) {
    if (-not (Test-Command "choco")) {
        Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        refreshenv
    }

    # Install Node.js 18
    if (-not (Test-Command "node")) {
        Write-Host "📱 Installing Node.js 18..." -ForegroundColor Yellow
        choco install nodejs --version=18.19.0 -y
        refreshenv
    }

    # Install PostgreSQL 15
    if (-not (Test-Command "psql")) {
        Write-Host "🗄️ Installing PostgreSQL 15..." -ForegroundColor Yellow
        choco install postgresql15 --params '/Password:simpleit_password_2024' -y
        refreshenv
    }

    # Install Git (if needed)
    if (-not (Test-Command "git")) {
        Write-Host "📋 Installing Git..." -ForegroundColor Yellow
        choco install git -y
        refreshenv
    }
}

# Verify installations
Write-Host "✅ Verifying installations..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js installation failed" -ForegroundColor Red
    exit 1
}
if (-not (Test-Command "psql")) {
    Write-Host "❌ PostgreSQL installation failed" -ForegroundColor Red
    exit 1
}

# Create application directory
Write-Host "📁 Creating application directory at $InstallPath..." -ForegroundColor Yellow
if (Test-Path $InstallPath) {
    Remove-Item $InstallPath -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallPath -Force

# Copy application files
Write-Host "📋 Copying application files..." -ForegroundColor Yellow
Copy-Item -Path ".\*" -Destination $InstallPath -Recurse -Force -Exclude @("node_modules", ".git", "*.log")

# Change to application directory
Set-Location $InstallPath

# Install global dependencies
Write-Host "🔧 Installing global dependencies..." -ForegroundColor Yellow
npm install -g pm2 tsx

# Install application dependencies
Write-Host "📦 Installing application dependencies..." -ForegroundColor Yellow
npm install

# Configure PostgreSQL
Write-Host "⚙️ Configuring PostgreSQL..." -ForegroundColor Yellow

# Start PostgreSQL service
Start-Service postgresql-x64-15
Set-Service -Name postgresql-x64-15 -StartupType Automatic

# Wait for PostgreSQL to be ready
Start-Sleep -Seconds 10

# Create database and user
$env:PGPASSWORD = "simpleit_password_2024"
$psqlCommands = @"
CREATE DATABASE simpleit;
CREATE USER simpleit_user WITH ENCRYPTED PASSWORD 'simpleit_password_2024';
GRANT ALL PRIVILEGES ON DATABASE simpleit TO simpleit_user;
ALTER USER simpleit_user CREATEDB;
"@

$psqlCommands | psql -U postgres -h localhost

# Create environment file
Write-Host "🔐 Creating environment configuration..." -ForegroundColor Yellow
@"
NODE_ENV=production
DATABASE_URL=postgresql://simpleit_user:simpleit_password_2024@localhost:5432/simpleit
SESSION_SECRET=simpleit_session_secret_2024_production
PORT=5000
PGHOST=localhost
PGPORT=5432
PGDATABASE=simpleit
PGUSER=simpleit_user
PGPASSWORD=simpleit_password_2024
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Create uploads directory
New-Item -ItemType Directory -Path "uploads" -Force

# Build application
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build 2>$null

# Create PM2 ecosystem file
Write-Host "📋 Creating PM2 configuration..." -ForegroundColor Yellow
@"
module.exports = {
  apps: [{
    name: 'simpleit',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
"@ | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8

# Create logs directory
New-Item -ItemType Directory -Path "logs" -Force

# Initialize database schema
Write-Host "🗄️ Initializing database..." -ForegroundColor Yellow
npm run db:push 2>$null

# Create Windows service using NSSM (Non-Sucking Service Manager)
Write-Host "🔧 Setting up Windows service..." -ForegroundColor Yellow
choco install nssm -y
refreshenv

# Install the service
nssm install SimpleIT pm2
nssm set SimpleIT AppDirectory $InstallPath
nssm set SimpleIT AppParameters "start ecosystem.config.js --env production"
nssm set SimpleIT Description "SimpleIT Asset Management System"
nssm set SimpleIT Start SERVICE_AUTO_START

# Configure firewall rules
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "SimpleIT HTTP" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow

# Start the application
Write-Host "🚀 Starting SimpleIT application..." -ForegroundColor Yellow
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Start the Windows service
Start-Service SimpleIT

# Final status check
Start-Sleep -Seconds 15
$pm2Status = pm2 list | Select-String "simpleit.*online"

if ($pm2Status) {
    Write-Host "✅ SimpleIT deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Application URL: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "🗄️ Database: PostgreSQL on localhost:5432" -ForegroundColor Cyan
    Write-Host "👤 Default Login: admin / admin123" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 To view logs: pm2 logs simpleit" -ForegroundColor Yellow
    Write-Host "🔄 To restart: Restart-Service SimpleIT" -ForegroundColor Yellow
    Write-Host "🛑 To stop: Stop-Service SimpleIT" -ForegroundColor Yellow
    Write-Host "📊 To check status: Get-Service SimpleIT" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔧 Configuration files:" -ForegroundColor Yellow
    Write-Host "   - App: $InstallPath" -ForegroundColor Gray
    Write-Host "   - Logs: $InstallPath\logs\" -ForegroundColor Gray
    Write-Host "   - Service: SimpleIT (Windows Service)" -ForegroundColor Gray
} else {
    Write-Host "❌ Deployment failed. Check logs with: pm2 logs simpleit" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Windows deployment completed successfully!" -ForegroundColor Green
Write-Host "💡 Remember to change default passwords for production use." -ForegroundColor Yellow