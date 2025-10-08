param(
  [Parameter(Mandatory=$true)] [string]$Server,
  [Parameter(Mandatory=$true)] [string]$Database,
  [Parameter(Mandatory=$true)] [string]$User,
  [Parameter(Mandatory=$true)] [string]$Password,
  [switch]$TrustServerCertificate
)

$ErrorActionPreference = 'Stop'

function Invoke-Sql {
  param(
    [string]$Query,
    [string]$InputFile
  )
  $trust = $false
  if ($TrustServerCertificate) { $trust = $true }

  $args = @('-S', $Server, '-d', $Database, '-U', $User, '-P', $Password, '-b', '-I')
  if ($trust) { $args += '-C' }

  if ($InputFile) {
    & sqlcmd @args -i $InputFile
  } else {
    & sqlcmd @args -Q $Query
  }
}

Write-Host "Ensuring schema_migrations table exists..."
Invoke-Sql -Query @"
if not exists (select 1 from sys.objects where object_id = object_id('dbo.schema_migrations') and type in ('U'))
begin
  create table dbo.schema_migrations (
    id int identity(1,1) primary key,
    filename nvarchar(260) not null unique,
    applied_at datetime2(3) not null default sysutcdatetime()
  );
end
"@


$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
# Run all top-level *.sql files except self and migration files
$ddlFiles = Get-ChildItem -Path $scriptDir -Filter '*.sql' | Where-Object {
    $_.Name -ne 'apply-migrations.ps1' -and $_.DirectoryName -eq $scriptDir -and $_.Name -notlike '*migration*'
} | Sort-Object Name

foreach ($file in $ddlFiles) {
    Write-Host "Applying DDL: $($file.Name)" -ForegroundColor Cyan
    Invoke-Sql -InputFile $file.FullName
    Write-Host "Applied DDL: $($file.Name)" -ForegroundColor Green
}

# Now run migrations as before
$migrationsDir = Join-Path $scriptDir 'migrations'
if (-not (Test-Path $migrationsDir)) {
  Write-Host "No migrations directory found at $migrationsDir" -ForegroundColor Yellow
  exit 0
}

$migrationFiles = Get-ChildItem -Path $migrationsDir -Filter '*.sql' | Sort-Object Name
foreach ($file in $migrationFiles) {
  $name = $file.Name
  $applied = Invoke-Sql -Query "select count(1) from dbo.schema_migrations where filename = '$name'" 2>$null
  $alreadyApplied = ($LASTEXITCODE -eq 0 -and $applied -match '----' -and $applied -match '1')
  if ($alreadyApplied) {
    Write-Host "Skipping already applied migration: $name" -ForegroundColor DarkGray
    continue
  }
  Write-Host "Applying migration: $name" -ForegroundColor Cyan
  Invoke-Sql -InputFile $file.FullName
  Invoke-Sql -Query "insert into dbo.schema_migrations(filename) values (N'$name')"
  Write-Host "Applied: $name" -ForegroundColor Green
}

Write-Host "All DDL and migrations processed." -ForegroundColor Green
