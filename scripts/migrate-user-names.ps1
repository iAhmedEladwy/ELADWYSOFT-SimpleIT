# Database migration script to add firstName and lastName to users table
# Run this script from the project root directory

Write-Host "🚀 Starting database migration: Add firstName and lastName to users table" -ForegroundColor Green
Write-Host "📅 Date: $(Get-Date)" -ForegroundColor Yellow
Write-Host ""

# Database connection details (adjust as needed)
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "simpleit" }
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }

Write-Host "🔧 Database Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $DB_HOST" -ForegroundColor White
Write-Host "   Port: $DB_PORT" -ForegroundColor White
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host "   User: $DB_USER" -ForegroundColor White
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
} catch {
    Write-Host "❌ PostgreSQL CLI (psql) is not available. Please install PostgreSQL client tools." -ForegroundColor Red
    exit 1
}

# Confirm before proceeding
$response = Read-Host "❓ Do you want to proceed with the migration? (y/N)"
if ($response -notmatch "^[Yy]$") {
    Write-Host "❌ Migration cancelled." -ForegroundColor Red
    exit 0
}

Write-Host "🔄 Running migration..." -ForegroundColor Yellow

# Run the migration
$connectionString = "host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=$DB_NAME"

try {
    & psql $connectionString -f "scripts/add-user-names-migration.sql"
    
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "   ✓ Added first_name column to users table" -ForegroundColor Green
    Write-Host "   ✓ Added last_name column to users table" -ForegroundColor Green
    Write-Host "   ✓ Populated existing users with employee names (where available)" -ForegroundColor Green
    Write-Host "   ✓ Added indexes for performance" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 You can now use firstName and lastName in user profiles!" -ForegroundColor Magenta
    
    Write-Host ""
    Write-Host "📊 Current users with names:" -ForegroundColor Cyan
    & psql $connectionString -c "
    SELECT 
      id, 
      username, 
      COALESCE(first_name, 'Not Set') as first_name,
      COALESCE(last_name, 'Not Set') as last_name,
      role
    FROM users 
    ORDER BY id;
    "
    
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed! Please check the error messages above." -ForegroundColor Red
    Write-Host "💡 Common issues:" -ForegroundColor Yellow
    Write-Host "   - Database connection problems" -ForegroundColor White
    Write-Host "   - Insufficient permissions" -ForegroundColor White
    Write-Host "   - Database doesn't exist" -ForegroundColor White
    exit 1
}