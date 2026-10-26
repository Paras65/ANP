@echo off
title Ambition News Portal - Local Runner
echo ====================================================
echo Starting Ambition News Portal (Local Development)
echo ====================================================
echo.

echo Starting Backend on http://localhost:5000 ...
start "ANP Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak > nul

echo Starting Frontend on http://localhost:5173 ...
start "ANP Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================================
echo [Backend]   http://localhost:5000
echo [API Health] http://localhost:5000/api/health
echo [Frontend]  http://localhost:5173
echo ====================================================
echo Close the respective terminal windows to stop the servers.
pause

