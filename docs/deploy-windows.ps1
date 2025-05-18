# SimpleIT Deployment Script for Windows Server
# This script automates the installation and configuration of SimpleIT on Windows
# Run this script in PowerShell with Administrator privileges

# Stop script on error
$ErrorActionPreference = "Stop"

# Configuration variables
$installDir = "C:\SimpleIT"
$logFile = "C:\SimpleIT\install.log"
$dbName = "simpleit"
$dbUser = "simpleit"
$dbPassword = "simpleit"
$appPort = 3000
$nodeVersion = "22"
$repoUrl = "https://github.com/yourorganization/simpleit.git"

# Create log function
function Log-Message {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        [switch]$IsError,
        [switch]$IsWarning
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    if ($IsError) {
        Write-Host $logMessage -ForegroundColor Red
    } elseif ($IsWarning) {
        Write-Host $logMessage -ForegroundColor Yellow
    } else {
        Write-Host $logMessage -ForegroundColor Green
    }
    
    Add-Content -Path $logFile -Value $logMessage
}

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run PowerShell as Administrator." -ForegroundColor Red
    exit 1
}

# Create install directory and log file
if (-not (Test-Path -Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir | Out-Null
}
if (-not (Test-Path -Path $logFile)) {
    New-Item -ItemType File -Path $logFile | Out-Null
}

# Display header
Write-Host "=============================================" -ForegroundColor Blue
Write-Host "    SimpleIT Asset Management System         " -ForegroundColor Blue
Write-Host "       Windows Deployment Script             " -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue
Write-Host ""

Log-Message "Starting SimpleIT installation on Windows"

# Check and install Chocolatey
Log-Message "Checking for Chocolatey package manager..."
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Log-Message "Installing Chocolatey..."
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
        Log-Message "Chocolatey installed successfully"
    } catch {
        Log-Message "Failed to install Chocolatey: $_" -IsError
        exit 1
    }
} else {
    Log-Message "Chocolatey is already installed"
}

# Install required software using Chocolatey
Log-Message "Installing required software..."
try {
    # Install Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Log-Message "Installing Node.js $nodeVersion..."
        choco install nodejs-lts --version $nodeVersion -y | Out-File -Append -FilePath $logFile
    } else {
        $currentNodeVersion = (node -v).Substring(1).Split('.')[0]
        if ($currentNodeVersion -ne $nodeVersion) {
            Log-Message "Node.js version $currentNodeVersion is installed, but version $nodeVersion is recommended." -IsWarning
            $choice = Read-Host "Continue with existing Node.js version? (y/n)"
            if ($choice -ne "y") {
                Log-Message "Removing existing Node.js..."
                choco uninstall nodejs -y | Out-File -Append -FilePath $logFile
                Log-Message "Installing Node.js $nodeVersion..."
                choco install nodejs-lts --version $nodeVersion -y | Out-File -Append -FilePath $logFile
            }
        } else {
            Log-Message "Node.js $nodeVersion is already installed"
        }
    }
    
    # Install Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Log-Message "Installing Git..."
        choco install git -y | Out-File -Append -FilePath $logFile
    } else {
        Log-Message "Git is already installed"
    }
    
    # Install PostgreSQL
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Log-Message "Installing PostgreSQL..."
        choco install postgresql --params '/Password:postgres' -y | Out-File -Append -FilePath $logFile
        
        # Add PostgreSQL bin to PATH if not already present
        $pgPath = "C:\Program Files\PostgreSQL\16\bin"
        if (-not ($env:Path -like "*$pgPath*")) {
            [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$pgPath", [EnvironmentVariableTarget]::Machine)
            $env:Path += ";$pgPath"
        }
    } else {
        Log-Message "PostgreSQL is already installed"
    }
    
    # Install NSSM (for creating Windows services)
    if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
        Log-Message "Installing NSSM (Non-Sucking Service Manager)..."
        choco install nssm -y | Out-File -Append -FilePath $logFile
    } else {
        Log-Message "NSSM is already installed"
    }
    
} catch {
    Log-Message "Failed to install required software: $_" -IsError
    exit 1
}

# Refresh PATH environment variable
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Configure PostgreSQL
Log-Message "Configuring PostgreSQL database..."
try {
    # Create database and user
    $pgbin = "C:\Program Files\PostgreSQL\16\bin"
    if (Test-Path "$pgbin\psql.exe") {
        # Check if database exists
        $dbExistsCmd = "& '$pgbin\psql' -U postgres -c `"SELECT 1 FROM pg_database WHERE datname = '$dbName'`" -t"
        $dbExists = Invoke-Expression $dbExistsCmd
        
        if ($dbExists -match "1") {
            Log-Message "Database '$dbName' already exists"
        } else {
            # Create user and database
            Log-Message "Creating PostgreSQL user and database..."
            Invoke-Expression "& '$pgbin\psql' -U postgres -c `"CREATE USER $dbUser WITH PASSWORD '$dbPassword';`""
            Invoke-Expression "& '$pgbin\psql' -U postgres -c `"CREATE DATABASE $dbName OWNER $dbUser;`""
            Invoke-Expression "& '$pgbin\psql' -U postgres -c `"GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;`""
            Log-Message "PostgreSQL database and user created successfully"
        }
    } else {
        Log-Message "PostgreSQL binaries not found. Please check your installation." -IsError
        exit 1
    }
} catch {
    Log-Message "Failed to configure PostgreSQL: $_" -IsError
    Log-Message "You may need to manually create a database named '$dbName' with user '$dbUser'" -IsWarning
}

# Clone or update the repository
Log-Message "Setting up application code..."
try {
    if (Test-Path "$installDir\.git") {
        # Repository exists, update it
        Set-Location $installDir
        git pull | Out-File -Append -FilePath $logFile
        Log-Message "Updated existing repository"
    } else {
        # Clean directory if not empty
        if ((Get-ChildItem -Path $installDir -Force | Measure-Object).Count -gt 0) {
            $choice = Read-Host "Directory $installDir is not empty. Do you want to remove its contents? (y/n)"
            if ($choice -eq "y") {
                Get-ChildItem -Path $installDir -Force | Remove-Item -Recurse -Force
            } else {
                Log-Message "Installation aborted. Please provide an empty directory." -IsError
                exit 1
            }
        }
        
        # Clone the repository
        Log-Message "Cloning repository..."
        try {
            git clone $repoUrl $installDir | Out-File -Append -FilePath $logFile
        } catch {
            Log-Message "Git clone failed: $_" -IsError
            $choice = Read-Host "Do you want to download and extract the latest release instead? (y/n)"
            if ($choice -eq "y") {
                Log-Message "Downloading latest release..."
                $tempZip = "$env:TEMP\simpleit.zip"
                # Replace with your actual release URL
                Invoke-WebRequest -Uri "https://github.com/yourorganization/simpleit/archive/main.zip" -OutFile $tempZip
                Expand-Archive -Path $tempZip -DestinationPath $env:TEMP
                Copy-Item -Path "$env:TEMP\simpleit-main\*" -Destination $installDir -Recurse -Force
                Remove-Item -Path $tempZip -Force
                Remove-Item -Path "$env:TEMP\simpleit-main" -Recurse -Force
            } else {
                Log-Message "Installation aborted." -IsError
                exit 1
            }
        }
    }
} catch {
    Log-Message "Failed to set up application code: $_" -IsError
    exit 1
}

# Create environment file
Log-Message "Creating environment configuration..."
try {
    $sessionSecret = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    
    $envContent = @"
# SimpleIT Environment Configuration
NODE_ENV=production
PORT=$appPort

# Database configuration
DATABASE_URL=postgres://$dbUser:$dbPassword@localhost:5432/$dbName

# Session configuration
SESSION_SECRET=$sessionSecret

# Application settings
ASSET_ID_PREFIX=SIT-
EMP_ID_PREFIX=EMP-
TICKET_ID_PREFIX=TKT-
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=English
"@
    
    Set-Content -Path "$installDir\.env" -Value $envContent
    Log-Message "Environment configuration created"
} catch {
    Log-Message "Failed to create environment configuration: $_" -IsError
    exit 1
}

# Install dependencies and build the application
Log-Message "Installing Node.js dependencies..."
try {
    Set-Location $installDir
    npm install --production | Out-File -Append -FilePath $logFile
    
    Log-Message "Building application..."
    npm run build | Out-File -Append -FilePath $logFile
    
    Log-Message "Setting up database schema..."
    npm run db:push | Out-File -Append -FilePath $logFile
} catch {
    Log-Message "Failed to install dependencies or build application: $_" -IsError
    exit 1
}

# Create Windows service using NSSM
Log-Message "Creating Windows service..."
try {
    # Remove existing service if it exists
    $serviceExists = Get-Service -Name "SimpleIT" -ErrorAction SilentlyContinue
    if ($serviceExists) {
        Log-Message "Removing existing SimpleIT service..."
        nssm stop SimpleIT | Out-File -Append -FilePath $logFile
        nssm remove SimpleIT confirm | Out-File -Append -FilePath $logFile
    }
    
    # Create new service
    Log-Message "Creating SimpleIT service..."
    $nodePath = (Get-Command node).Path
    nssm install SimpleIT $nodePath "$installDir\dist\server\index.js" | Out-File -Append -FilePath $logFile
    nssm set SimpleIT AppDirectory $installDir | Out-File -Append -FilePath $logFile
    nssm set SimpleIT AppEnvironmentExtra "NODE_ENV=production" "PATH=$env:Path" | Out-File -Append -FilePath $logFile
    nssm set SimpleIT DisplayName "SimpleIT Asset Management" | Out-File -Append -FilePath $logFile
    nssm set SimpleIT Description "SimpleIT Asset Management System" | Out-File -Append -FilePath $logFile
    nssm set SimpleIT Start SERVICE_AUTO_START | Out-File -Append -FilePath $logFile
    
    # Set recovery options
    nssm set SimpleIT AppExit Default Restart | Out-File -Append -FilePath $logFile
    nssm set SimpleIT AppRestartDelay 5000 | Out-File -Append -FilePath $logFile
    
    # Start the service
    Log-Message "Starting SimpleIT service..."
    nssm start SimpleIT | Out-File -Append -FilePath $logFile
    
    # Verify service status
    Start-Sleep -Seconds 5
    $serviceStatus = Get-Service -Name "SimpleIT" -ErrorAction SilentlyContinue
    if ($serviceStatus.Status -eq "Running") {
        Log-Message "SimpleIT service is running"
    } else {
        Log-Message "SimpleIT service failed to start. Check the Windows Event Viewer for details." -IsWarning
    }
} catch {
    Log-Message "Failed to create or start Windows service: $_" -IsError
    Log-Message "You may need to manually create a service using NSSM:" -IsWarning
    Log-Message "nssm install SimpleIT $nodePath $installDir\dist\server\index.js" -IsWarning
}

# Display installation summary
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet* | Where-Object { $_.IPAddress -notmatch "^169" } | Select-Object -First 1).IPAddress
if (-not $ipAddress) {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^169" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "    SimpleIT Installation Complete!          " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Installation directory: $installDir" -ForegroundColor Blue
Write-Host "Database name: $dbName" -ForegroundColor Blue
Write-Host "Database user: $dbUser" -ForegroundColor Blue
Write-Host "Application URL: http://${ipAddress}:$appPort" -ForegroundColor Blue
Write-Host ""
Write-Host "To manage the service:" -ForegroundColor Yellow
Write-Host "  nssm start|stop|restart SimpleIT" -ForegroundColor Yellow
Write-Host "  or use Windows Services Manager" -ForegroundColor Yellow
Write-Host ""
Write-Host "Installation log: $logFile" -ForegroundColor Blue
Write-Host ""
Write-Host "IMPORTANT: For production use, configure a reverse proxy" -ForegroundColor Yellow
Write-Host "           with HTTPS using IIS or Nginx for Windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "Thank you for installing SimpleIT Asset Management!" -ForegroundColor Green
Write-Host ""