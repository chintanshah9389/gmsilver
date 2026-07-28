@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "PGCTL=C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe"
set "PGDATA=%ROOT%.local-postgres\data"

if not exist "%PGCTL%" (
  echo [WARN] pg_ctl not found at "%PGCTL%".
  exit /b 0
)

if not exist "%PGDATA%\PG_VERSION" (
  echo [WARN] Local cluster not initialized at "%PGDATA%".
  exit /b 0
)

echo Stopping local PostgreSQL on port 5433...
"%PGCTL%" -D "%PGDATA%" stop -m fast

endlocal
