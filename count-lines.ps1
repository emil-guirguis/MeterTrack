$extensions = @('ts', 'tsx', 'js', 'jsx', 'sql', 'json', 'css', 'scss', 'html', 'md')
$excludeDirs = @('node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.vscode')

$totalLines = 0
$fileCount = 0

foreach ($ext in $extensions) {
    Get-ChildItem -Path . -Filter "*.$ext" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        $fullPath = $_.FullName
        $skip = $false
        
        foreach ($dir in $excludeDirs) {
            if ($fullPath -like "*\$dir\*") {
                $skip = $true
                break
            }
        }
        
        if (-not $skip) {
            $lines = (Get-Content $fullPath | Measure-Object -Line).Lines
            $totalLines += $lines
            $fileCount++
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Lines of Code: $totalLines" -ForegroundColor Green
Write-Host "Total Files: $fileCount" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
