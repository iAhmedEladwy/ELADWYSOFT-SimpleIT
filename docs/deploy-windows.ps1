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
$dbPassword = "simpleit_password"  # Please change this for production
$appPort = 3000
$nodeVersion = "18"  # Updated to use Node.js 18 LTS which has better compatibility

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

# Copy current directory contents to install directory
Log-Message "Copying application files to $installDir..."
try {
    Copy-Item -Path ".\*" -Destination $installDir -Recurse -Force -ErrorAction SilentlyContinue
    Log-Message "Files copied successfully"
} catch {
    Log-Message "Error copying files. Continuing with existing files..." -IsWarning
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
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } catch {
        Log-Message "Failed to install Chocolatey: $_" -IsError
        Log-Message "Please install Chocolatey manually: https://chocolatey.org/install" -IsWarning
        exit 1
    }
} else {
    Log-Message "Chocolatey is already installed"
}

# Install required software using Chocolatey
Log-Message "Installing required software..."
try {
    # Install Node.js - using exact version to prevent issues
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Log-Message "Installing Node.js $nodeVersion..."
        choco install nodejs-lts --version $nodeVersion -y | Out-File -Append -FilePath $logFile
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        $currentNodeVersion = (node -v).Substring(1).Split('.')[0]
        Log-Message "Node.js v$currentNodeVersion is already installed"
    }
    
    # Install Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Log-Message "Installing Git..."
        choco install git -y | Out-File -Append -FilePath $logFile
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        Log-Message "Git is already installed"
    }
    
    # Install PostgreSQL
    if (-not (Get-ItemProperty 'HKLM:\SOFTWARE\PostgreSQL\Installations\*' -ErrorAction SilentlyContinue)) {
        Log-Message "Installing PostgreSQL..."
        choco install postgresql14 --params '/Password:postgres' -y | Out-File -Append -FilePath $logFile
        
        # Add PostgreSQL bin to PATH if not already present
        $pgPath = "C:\Program Files\PostgreSQL\14\bin"
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
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } else {
        Log-Message "NSSM is already installed"
    }
    
} catch {
    Log-Message "Failed to install required software: $_" -IsError
    Log-Message "Please install the missing software manually and try again." -IsWarning
    exit 1
}

# Refresh PATH environment variable
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Configure PostgreSQL
Log-Message "Configuring PostgreSQL database..."
try {
    # Find PostgreSQL bin directory
    $pgbin = "C:\Program Files\PostgreSQL\14\bin"
    if (-not (Test-Path "$pgbin\psql.exe")) {
        # Try to find psql.exe in other PostgreSQL versions
        $pgVersions = @("14", "15", "16", "13", "12")
        foreach ($ver in $pgVersions) {
            if (Test-Path "C:\Program Files\PostgreSQL\$ver\bin\psql.exe") {
                $pgbin = "C:\Program Files\PostgreSQL\$ver\bin"
                break
            }
        }
    }
    
    if (Test-Path "$pgbin\psql.exe") {
        # Set PGPASSWORD environment variable for postgres user
        $env:PGPASSWORD = "postgres"
        
        # Check if database exists
        $dbExistsCmd = "& '$pgbin\psql' -U postgres -h localhost -c `"SELECT 1 FROM pg_database WHERE datname = '$dbName'`" -t"
        $dbExists = Invoke-Expression $dbExistsCmd
        
        if ($dbExists -match "1") {
            Log-Message "Database '$dbName' already exists"
        } else {
            # Create user and database
            Log-Message "Creating PostgreSQL user and database..."
            Invoke-Expression "& '$pgbin\psql' -U postgres -h localhost -c `"CREATE USER $dbUser WITH PASSWORD '$dbPassword';`""
            Invoke-Expression "& '$pgbin\psql' -U postgres -h localhost -c `"CREATE DATABASE $dbName OWNER $dbUser;`""
            Invoke-Expression "& '$pgbin\psql' -U postgres -h localhost -c `"GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;`""
            Log-Message "PostgreSQL database and user created successfully"
        }
    } else {
        Log-Message "PostgreSQL binaries not found. Please check your installation." -IsError
        Log-Message "You may need to manually create a database named '$dbName' with user '$dbUser'" -IsWarning
    }
} catch {
    Log-Message "Failed to configure PostgreSQL: $_" -IsError
    Log-Message "You may need to manually create a database named '$dbName' with user '$dbUser'" -IsWarning
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

# Required for Replit Auth to work
REPLIT_DOMAINS=localhost
ISSUER_URL=http://localhost:$appPort
REPL_ID=simpleit-production

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
    npm install --omit=dev | Out-File -Append -FilePath $logFile
    
    Log-Message "Building application..."
    npm run build | Out-File -Append -FilePath $logFile
    
    Log-Message "Setting up database schema..."
    npm run db:push | Out-File -Append -FilePath $logFile
} catch {
    Log-Message "Failed to install dependencies or build application: $_" -IsError
    Log-Message "Please check logs for details and try running the commands manually:" -IsWarning
    Log-Message "cd $installDir" -IsWarning
    Log-Message "npm install --omit=dev" -IsWarning
    Log-Message "npm run build" -IsWarning
    Log-Message "npm run db:push" -IsWarning
}

# Create Windows service using NSSM
Log-Message "Creating Windows service..."
try {
    # Check if NSSM is installed
    if (Get-Command nssm -ErrorAction SilentlyContinue) {
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
        $scriptPath = "$installDir\server\index.js"
        
        # Ensure the script path exists
        if (-not (Test-Path $scriptPath)) {
            Log-Message "Script not found at: $scriptPath" -IsError
            $scriptPath = Get-ChildItem -Path $installDir -Recurse -Filter "index.js" | Where-Object { $_.DirectoryName -match "server" } | Select-Object -First 1 -ExpandProperty FullName
            Log-Message "Found script at: $scriptPath" -IsWarning
        }
        
        nssm install SimpleIT $nodePath $scriptPath | Out-File -Append -FilePath $logFile
        nssm set SimpleIT AppDirectory $installDir | Out-File -Append -FilePath $logFile
        nssm set SimpleIT AppEnvironmentExtra "NODE_ENV=production" "PATH=$env:Path" | Out-File -Append -FilePath $logFile
        nssm set SimpleIT DisplayName "SimpleIT Asset Management" | Out-File -Append -FilePath $logFile
        nssm set SimpleIT Description "SimpleIT Asset Management System" | Out-File -Append -FilePath $logFile
        nssm set SimpleIT Start SERVICE_AUTO_START | Out-File -Append -FilePath $logFile
        
        # Set recovery options
        nssm set SimpleIT AppExit Default Restart | Out-File -Append -FilePath $logFile
        nssm set SimpleIT AppRestartDelay 5000 | Out-File -Append -FilePath $logFile
        
        # Ensure AppDirectory is valid
        nssm get SimpleIT AppDirectory | Out-File -Append -FilePath $logFile
        
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
            Log-Message "Attempting to start service with additional debugging..." -IsWarning
            
            # Additional debugging
            nssm set SimpleIT AppStderr "$installDir\error.log" | Out-File -Append -FilePath $logFile
            nssm set SimpleIT AppStdout "$installDir\output.log" | Out-File -Append -FilePath $logFile
            nssm start SimpleIT | Out-File -Append -FilePath $logFile
        }
    } else {
        Log-Message "NSSM not found in PATH. Cannot create Windows service." -IsError
        Log-Message "You can try running the application manually with:" -IsWarning
        Log-Message "cd $installDir && node server/index.js" -IsWarning
    }
} catch {
    Log-Message "Failed to create or start Windows service: $_" -IsError
    Log-Message "You may need to manually create a service using NSSM:" -IsWarning
    Log-Message "nssm install SimpleIT node.exe $installDir\server\index.js" -IsWarning
}

# Display installation summary
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Ethernet* | Where-Object { $_.IPAddress -notmatch "^169" } | Select-Object -First 1).IPAddress
if (-not $ipAddress) {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^169" -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
    if (-not $ipAddress) {
        $ipAddress = "localhost"
    }
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
Write-Host "Log files:" -ForegroundColor Yellow
Write-Host "  Installation log: $logFile" -ForegroundColor Yellow
Write-Host "  Application output: $installDir\output.log" -ForegroundColor Yellow
Write-Host "  Application errors: $installDir\error.log" -ForegroundColor Yellow
Write-Host ""
Write-Host "To manage the service:" -ForegroundColor Yellow
Write-Host "  nssm start|stop|restart SimpleIT" -ForegroundColor Yellow
Write-Host "  or use Windows Services Manager" -ForegroundColor Yellow
Write-Host ""
Write-Host "Default login credentials:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor Yellow
Write-Host "  Password: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: For production use, configure a reverse proxy" -ForegroundColor Red
Write-Host "           with HTTPS using IIS or Nginx for Windows" -ForegroundColor Red
Write-Host ""
Write-Host "Thank you for installing SimpleIT Asset Management!" -ForegroundColor Green
Write-Host ""