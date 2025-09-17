#!/bin/bash

# Database migration script to add firstName and lastName to users table
# Run this script from the project root directory

echo "🚀 Starting database migration: Add firstName and lastName to users table"
echo "📅 Date: $(date)"
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL CLI (psql) is not available. Please install PostgreSQL client tools."
    exit 1
fi

# Database connection details (adjust as needed)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-simpleit}
DB_USER=${DB_USER:-postgres}

echo "🔧 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Confirm before proceeding
read -p "❓ Do you want to proceed with the migration? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled."
    exit 0
fi

echo "🔄 Running migration..."

# Run the migration
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "scripts/add-user-names-migration.sql"; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo "📋 Summary:"
    echo "   ✓ Added first_name column to users table"
    echo "   ✓ Added last_name column to users table"
    echo "   ✓ Populated existing users with employee names (where available)"
    echo "   ✓ Added indexes for performance"
    echo ""
    echo "🎉 You can now use firstName and lastName in user profiles!"
else
    echo ""
    echo "❌ Migration failed! Please check the error messages above."
    echo "💡 Common issues:"
    echo "   - Database connection problems"
    echo "   - Insufficient permissions"
    echo "   - Database doesn't exist"
    exit 1
fi

echo ""
echo "📊 Current users with names:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  id, 
  username, 
  COALESCE(first_name, 'Not Set') as first_name,
  COALESCE(last_name, 'Not Set') as last_name,
  role
FROM users 
ORDER BY id;
"