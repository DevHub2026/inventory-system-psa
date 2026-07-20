@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found in PATH.
  echo Install Node.js or open this project from a terminal where node is available.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found in PATH.
  echo Install Node.js or open this project from a terminal where npm is available.
  pause
  exit /b 1
)

where php >nul 2>nul
if errorlevel 1 (
  echo ERROR: PHP was not found in PATH.
  echo Install PHP or open this project from a terminal where php is available.
  pause
  exit /b 1
)

if not exist "backend\artisan" (
  echo ERROR: backend\artisan was not found.
  echo Run this file from the PSA Inventory System project root.
  pause
  exit /b 1
)

if not exist "frontend\package.json" (
  echo ERROR: frontend\package.json was not found.
  echo Run this file from the PSA Inventory System project root.
  pause
  exit /b 1
)

if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  pushd frontend
  call npm install
  if errorlevel 1 (
    popd
    echo ERROR: npm install failed.
    pause
    exit /b 1
  )
  popd
)

if not exist "backend\vendor" (
  echo ERROR: backend\vendor was not found.
  echo Run composer install inside backend first:
  echo   cd backend
  echo   composer install
  pause
  exit /b 1
)

if "%BACKEND_PORT%"=="" set BACKEND_PORT=8000
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=5173
if "%VITE_API_BASE_URL%"=="" set VITE_API_BASE_URL=/api/v1

echo Starting backend + frontend...
echo backend: http://localhost:%BACKEND_PORT%
echo frontend: http://localhost:%FRONTEND_PORT%
echo phone: use the LAN URL printed by runner.js
echo api: %VITE_API_BASE_URL%

rem If you want custom ports, set env vars before running:
rem   set BACKEND_PORT=8000
rem   set FRONTEND_PORT=5173
node runner.js

if errorlevel 1 (
  echo Runner stopped with an error.
  pause
  exit /b 1
)

endlocal

