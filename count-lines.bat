@echo off
setlocal enabledelayedexpansion

set "totalLines=0"
set "fileCount=0"

echo Scanning files...

for /r . %%F in (*.ts *.tsx *.js *.jsx *.sql *.json *.css *.scss *.html *.md) do (
    set "path=%%F"
    if not "!path:node_modules=!"=="!path!" goto skip
    if not "!path:.git=!"=="!path!" goto skip
    if not "!path:dist=!"=="!path!" goto skip
    if not "!path:build=!"=="!path!" goto skip
    
    for /f %%A in ('find /c /v "" ^< "%%F"') do (
        set "lines=%%A"
        set /a totalLines+=!lines!
        set /a fileCount+=1
    )
    
    :skip
)

echo.
echo ========================================
echo Total Lines of Code: %totalLines%
echo Total Files: %fileCount%
echo ========================================
