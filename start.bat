@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0" 

echo Starting backend + frontend...
echo backend: http://localhost:8000
echo frontend: http://localhost:5173

rem If you want custom ports, set env vars before running:
rem   set BACKEND_PORT=8000
rem   set FRONTEND_PORT=5173
rem node runner.js

endlocal

