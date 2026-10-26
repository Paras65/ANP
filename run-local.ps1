# Ambition News Portal - Local Runner (PowerShell)
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Starting Ambition News Portal (Local Development)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Starting Backend on http://localhost:5000 ..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\backend`" && npm run dev"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\frontend`" && npm run dev"

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "Both servers are launching in separate terminal windows:" -ForegroundColor Yellow
Write-Host "  Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "  Health Check: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  Frontend App: http://localhost:5173" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan

