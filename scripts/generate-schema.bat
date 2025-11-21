@echo off
REM Quick launcher for schema generator on Windows
REM Usage: scripts\generate-schema.bat meter

if "%1"=="" (
    echo Usage: scripts\generate-schema.bat ^<table_name^>
    echo Example: scripts\generate-schema.bat meter
    exit /b 1
)

node scripts/schema-generator.js %1
