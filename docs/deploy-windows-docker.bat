@echo off
:: SimpleIT Deployment Script for Windows with Docker Desktop
:: This script automates the deployment of SimpleIT using Docker Desktop on Windows

echo.
echo ========================================================
echo SimpleIT Docker Deployment Script for Windows
echo ========================================================
echo.

:: Configuration
set DB_PASSWORD=simpleit_secure_password
for /f "tokens=*" %%a in ('powershell -Command "[Guid]::NewGuid().ToString()"') do set SESSION_SECRET=%%a

:: Check if Docker is installed and running
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not running or not installed.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    echo and ensure it is running before executing this script.
    exit /b 1
)

echo Creating docker-compose.yml file...
(
echo version: '3.8'
echo.
echo services:
echo   # PostgreSQL database
echo   postgres:
echo     image: postgres:14
echo     container_name: simpleit-postgres
echo     restart: always
echo     environment:
echo       POSTGRES_USER: simpleituser
echo       POSTGRES_PASSWORD: %DB_PASSWORD%
echo       POSTGRES_DB: simpleit
echo     volumes:
echo       - postgres_data:/var/lib/postgresql/data
echo     ports:
echo       - "5432:5432"
echo     healthcheck:
echo       test: ["CMD-SHELL", "pg_isready -U simpleituser -d simpleit"]
echo       interval: 10s
echo       timeout: 5s
echo       retries: 5
echo.
echo   # SimpleIT application
echo   app:
echo     build:
echo       context: .
echo       dockerfile: Dockerfile
echo     container_name: simpleit-app
echo     restart: always
echo     depends_on:
echo       postgres:
echo         condition: service_healthy
echo     environment:
echo       NODE_ENV: production
echo       DATABASE_URL: postgres://simpleituser:%DB_PASSWORD%@postgres:5432/simpleit
echo       SESSION_SECRET: %SESSION_SECRET%
echo     ports:
echo       - "80:3000"
echo     volumes:
echo       - ./uploads:/app/uploads
echo.
echo volumes:
echo   postgres_data:
) > docker-compose.yml

echo Creating Dockerfile...
(
echo # Use Node.js LTS
echo FROM node:18-alpine
echo.
echo # Set working directory
echo WORKDIR /app
echo.
echo # Copy package files and install dependencies
echo COPY package*.json ./
echo RUN npm ci
echo.
echo # Copy application code
echo COPY . .
echo.
echo # Build the application
echo RUN npm run build
echo.
echo # Set environment variables
echo ENV NODE_ENV=production
echo ENV PORT=3000
echo.
echo # Expose the application port
echo EXPOSE 3000
echo.
echo # Start the application
echo CMD ["npm", "start"]
) > Dockerfile

echo.
echo Building and starting Docker containers...
docker-compose up -d

echo.
echo Waiting for containers to start (this may take a few minutes)...
timeout /t 30 /nobreak > nul

echo.
echo Initializing the database...
docker-compose exec app npm run db:push

echo.
echo ========================================================
echo Deployment complete!
echo ========================================================
echo.
echo SimpleIT is now accessible at http://localhost
echo.
echo Default login credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo IMPORTANT: Change your admin password immediately after first login!
echo.
echo To view logs: docker-compose logs -f
echo To stop the application: docker-compose down
echo.
echo Press any key to exit...
pause > nul