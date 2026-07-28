@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
cd /d "%ROOT%"

if exist "%ROOT%scripts\sync-env.ps1" (
  echo [setup] Syncing env files from .env.shared ...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\sync-env.ps1" -RootPath "%ROOT%"
  if not %errorlevel%==0 (
    echo [ERROR] Env sync failed. Please check .env.shared and try again.
    exit /b 1
  )
) else (
  echo [WARN] scripts\sync-env.ps1 not found. Skipping env sync.
)

echo.
echo ==========================================
echo   GM Silver Local Environment - START
echo ==========================================
echo Root: %ROOT%
echo.

if not exist "%ROOT%backend\node_modules" (
  echo [WARN] backend dependencies not found. Run npm install in backend.
)
if not exist "%ROOT%admin-panel\node_modules" (
  echo [WARN] admin-panel dependencies not found. Run npm install in admin-panel.
)
if not exist "%ROOT%mobile\node_modules" (
  echo [WARN] mobile dependencies not found. Run npm install in mobile.
)

where docker >nul 2>&1
if %errorlevel%==0 (
  echo [1/4] Starting PostgreSQL container...
  docker compose up -d postgres
) else (
  if exist "%ROOT%backend\start-db-local.bat" (
    echo [1/4] Docker not found. Starting backend local PostgreSQL on port 5433...
    call "%ROOT%backend\start-db-local.bat"
  ) else (
    echo [1/4] Docker not found. Skipping PostgreSQL startup.
  )
)

echo [2/4] Starting backend API on http://localhost:3001 ...
start "GM-Silver-Backend" cmd /k "cd /d "%ROOT%backend" && npm run start:dev"
call :wait_for_port "Backend API" "127.0.0.1" 3001 120

echo [3/4] Starting admin panel on http://localhost:3000 ...
start "GM-Silver-Admin" cmd /k "cd /d "%ROOT%admin-panel" && npm run dev"
call :wait_for_port "Admin Panel" "127.0.0.1" 3000 180

echo [4/4] Starting React Native app in browser on http://localhost:8081 ...
start "GM-Silver-Web" cmd /k "cd /d "%ROOT%mobile" && npm run web"
call :wait_for_port "Web Frontend" "127.0.0.1" 8081 180

echo Opening React Native app in browser...
start http://localhost:8081

echo.
echo ==========================================
echo   GM Silver services are running:
echo   - Backend API: http://localhost:3001
echo   - Admin Panel: http://localhost:3000
echo   - Web Frontend (Expo): http://localhost:8081
echo ==========================================
echo.

if /I "%~1"=="ios" (
  echo Launching iOS app...
  start "GM-Silver-iOS" cmd /k "cd /d "%ROOT%mobile" && npm run ios"
)

echo.
echo All core services started.
echo.
echo Optional mobile app launch:
echo   start-local.bat ios
echo.
echo Stop everything with: stop-local.bat
echo.

endlocal

goto :eof

:wait_for_port
set "SERVICE_NAME=%~1"
set "SERVICE_HOST=%~2"
set "SERVICE_PORT=%~3"
set "SERVICE_TIMEOUT=%~4"

echo Waiting for %SERVICE_NAME% on %SERVICE_HOST%:%SERVICE_PORT% ...
powershell -NoProfile -Command "$h='%SERVICE_HOST%'; $p=%SERVICE_PORT%; $timeout=%SERVICE_TIMEOUT%; $sw=[Diagnostics.Stopwatch]::StartNew(); while($sw.Elapsed.TotalSeconds -lt $timeout){ try { $c=New-Object Net.Sockets.TcpClient; $ar=$c.BeginConnect($h,$p,$null,$null); if($ar.AsyncWaitHandle.WaitOne(1000)){ $c.EndConnect($ar); $c.Close(); exit 0 } $c.Close() } catch {} Start-Sleep -Milliseconds 500 }; exit 1"

if %errorlevel%==0 (
  echo [OK] %SERVICE_NAME% is reachable.
) else (
  echo [WARN] %SERVICE_NAME% did not become ready within %SERVICE_TIMEOUT%s.
)

exit /b 0
