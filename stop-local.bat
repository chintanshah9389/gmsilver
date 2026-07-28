@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo.
echo ==========================================
echo   GM Silver Local Environment - STOP
echo ==========================================
echo.

echo Stopping app windows...
taskkill /FI "WINDOWTITLE eq GM-Silver-Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GM-Silver-Admin*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GM-Silver-Metro*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GM-Silver-Android*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq GM-Silver-iOS*" /T /F >nul 2>&1

echo Stopping PostgreSQL services...
where docker >nul 2>&1
if %errorlevel%==0 (
  docker compose stop postgres >nul 2>&1
)
if exist "%ROOT%backend\stop-db-local.bat" (
  call "%ROOT%backend\stop-db-local.bat" >nul 2>&1
)

echo.
echo Local services stopped.
echo.

endlocal
