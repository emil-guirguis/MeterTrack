# MongoDB to PostgreSQL Migration Script
# This script creates PostgreSQL tables and migrates data from MongoDB

Write-Host "🚀 MongoDB to PostgreSQL Migration" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if .env.migration file exists
if (-not (Test-Path ".env.migration")) {
    Write-Host "❌ .env.migration file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.migration.example to .env.migration and configure your database connections." -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env.migration
Get-Content ".env.migration" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

Write-Host ""
Write-Host "📋 Step 1: Creating PostgreSQL tables..." -ForegroundColor Cyan

# Check if PostgreSQL is accessible
try {
    # Test PostgreSQL connection using environment variables
    $env:PGPASSWORD = $env:POSTGRES_PASSWORD
    $testConnection = psql -h $env:POSTGRES_HOST -p $env:POSTGRES_PORT -U $env:POSTGRES_USER -d $env:POSTGRES_DB -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cannot connect to PostgreSQL database!" -ForegroundColor Red
        Write-Host "Please check your PostgreSQL connection settings in .env.migration" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ PostgreSQL connection successful" -ForegroundColor Green
    
    # Run the table creation script
    psql -h $env:POSTGRES_HOST -p $env:POSTGRES_PORT -U $env:POSTGRES_USER -d $env:POSTGRES_DB -f "create-postgres-tables.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL tables created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Table creation completed with warnings (tables may already exist)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error creating PostgreSQL tables: $_" -ForegroundColor Red
    Write-Host "Attempting to continue with data migration..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Step 2: Migrating data from MongoDB to PostgreSQL..." -ForegroundColor Cyan

# Run the Node.js migration script
try {
    node migrate-mongo-to-postgres.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Your data has been migrated from MongoDB to PostgreSQL!" -ForegroundColor Green
        Write-Host "You can now use your PostgreSQL database for the facility management application." -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your application configuration to use PostgreSQL instead of MongoDB" -ForegroundColor White
Write-Host "2. Test your application with the new PostgreSQL database" -ForegroundColor White
Write-Host "3. Consider backing up your MongoDB data before making the switch permanent" -ForegroundColor White