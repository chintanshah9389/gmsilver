@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "PGCTL=C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe"
set "PGDATA=%ROOT%.local-postgres\data"
set "PGLOG=%ROOT%.local-postgres\postgres.log"

if not exist "%PGCTL%" (
  echo [ERROR] pg_ctl not found at "%PGCTL%".
  exit /b 1
)

if not exist "%PGDATA%\PG_VERSION" (
  echo [ERROR] Local cluster not initialized at "%PGDATA%".
  echo Run init once from backend folder or ask Copilot to bootstrap local postgres.
  exit /b 1
)

echo Starting local PostgreSQL on port 5433...
"%PGCTL%" -D "%PGDATA%" -l "%PGLOG%" -o "-p 5433" start

endlocal
