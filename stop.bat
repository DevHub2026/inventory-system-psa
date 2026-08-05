@echo off

rem Request administrator permission if not already elevated
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator permission...

    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

setlocal

cd /d "%~dp0"

echo.
echo Stopping PSA Inventory System development services...
echo.

rem Stop Laravel development server on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Stopping backend process on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)

rem Stop Vite development server on port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Stopping frontend process on port 5173...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Checking PostgreSQL...

sc query "postgresql-x64-18" | find "RUNNING" >nul

if errorlevel 1 (
    echo PostgreSQL is already stopped.
) else (
    echo Stopping PostgreSQL...

    net stop "postgresql-x64-18"

    if errorlevel 1 (
        echo.
        echo ERROR: PostgreSQL could not be stopped.
        pause
        exit /b 1
    )

    echo PostgreSQL stopped successfully.
)

echo.
echo PSA Inventory System services have been stopped.
pause

endlocal