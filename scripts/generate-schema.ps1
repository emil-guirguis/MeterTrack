#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick launcher for schema generator
.DESCRIPTION
    Generates backend model and frontend schema from database table
.PARAMETER TableName
    Name of the database table to generate code from
.EXAMPLE
    .\scripts\generate-schema.ps1 meter
.EXAMPLE
    .\scripts\generate-schema.ps1 device
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$TableName
)

Write-Host "🚀 Generating schema for table: $TableName" -ForegroundColor Cyan
Write-Host ""

node scripts/schema-generator.js $TableName

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✨ Success! Check the generated/ directory for output files" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review: generated/$($TableName)_schema_summary.txt" -ForegroundColor Gray
    Write-Host "  2. Backend: cp generated/*.js client/backend/src/models/" -ForegroundColor Gray
    Write-Host "  3. Frontend: cp generated/*.ts client/frontend/src/features/$($TableName)s/" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Generation failed. Check error messages above." -ForegroundColor Red
}
