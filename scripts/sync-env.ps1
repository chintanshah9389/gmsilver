param(
  [string]$RootPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$sharedEnvPath = Join-Path $RootPath '.env.shared'
$sharedExamplePath = Join-Path $RootPath '.env.shared.example'

if (-not (Test-Path $sharedEnvPath)) {
  if (Test-Path $sharedExamplePath) {
    Copy-Item $sharedExamplePath $sharedEnvPath -Force
    Write-Host "[sync-env] Created .env.shared from .env.shared.example. Update secrets in .env.shared." -ForegroundColor Yellow
  } else {
    throw "[sync-env] Missing .env.shared and .env.shared.example"
  }
}

$values = @{}
foreach ($line in Get-Content $sharedEnvPath) {
  $trimmed = $line.Trim()
  if (-not $trimmed -or $trimmed.StartsWith('#')) {
    continue
  }

  $parts = $line.Split('=', 2)
  if ($parts.Count -lt 2) {
    continue
  }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()
  $values[$key] = $value
}

function Get-EnvValue {
  param(
    [string]$Key,
    [string]$DefaultValue = ''
  )

  if ($values.ContainsKey($Key) -and $null -ne $values[$Key] -and $values[$Key] -ne '') {
    return $values[$Key]
  }

  return $DefaultValue
}

$backendEnv = @(
  "NODE_ENV=$(Get-EnvValue 'NODE_ENV' 'development')"
  "PORT=$(Get-EnvValue 'BACKEND_PORT' '3001')"
  "API_PREFIX=$(Get-EnvValue 'API_PREFIX' 'api/v1')"
  "DATABASE_URL=$(Get-EnvValue 'DATABASE_URL' 'postgresql://postgres:password@localhost:5432/gm_silver')"
  "JWT_ACCESS_SECRET=$(Get-EnvValue 'JWT_ACCESS_SECRET')"
  "JWT_REFRESH_SECRET=$(Get-EnvValue 'JWT_REFRESH_SECRET')"
  "JWT_ACCESS_EXPIRES_IN=$(Get-EnvValue 'JWT_ACCESS_EXPIRES_IN' '15m')"
  "JWT_REFRESH_EXPIRES_IN=$(Get-EnvValue 'JWT_REFRESH_EXPIRES_IN' '7d')"
  "R2_ACCOUNT_ID=$(Get-EnvValue 'R2_ACCOUNT_ID')"
  "R2_ENDPOINT=$(Get-EnvValue 'R2_ENDPOINT')"
  "R2_ACCESS_KEY_ID=$(Get-EnvValue 'R2_ACCESS_KEY_ID')"
  "R2_SECRET_ACCESS_KEY=$(Get-EnvValue 'R2_SECRET_ACCESS_KEY')"
  "R2_BUCKET=$(Get-EnvValue 'R2_BUCKET' 'gm-silver')"
  "R2_PUBLIC_URL=$(Get-EnvValue 'R2_PUBLIC_URL')"
  "FIREBASE_PROJECT_ID=$(Get-EnvValue 'FIREBASE_PROJECT_ID')"
  "FIREBASE_CLIENT_EMAIL=$(Get-EnvValue 'FIREBASE_CLIENT_EMAIL')"
  "FIREBASE_PRIVATE_KEY=$(Get-EnvValue 'FIREBASE_PRIVATE_KEY')"
  "CORS_ORIGINS=$(Get-EnvValue 'CORS_ORIGINS' 'http://localhost:3000')"
  "THROTTLE_TTL=$(Get-EnvValue 'THROTTLE_TTL' '60')"
  "THROTTLE_LIMIT=$(Get-EnvValue 'THROTTLE_LIMIT' '60')"
  "COMPANY_NAME=$(Get-EnvValue 'COMPANY_NAME' 'GM Silver')"
  "COMPANY_ADDRESS=$(Get-EnvValue 'COMPANY_ADDRESS')"
  "COMPANY_PHONE=$(Get-EnvValue 'COMPANY_PHONE')"
  "COMPANY_EMAIL=$(Get-EnvValue 'COMPANY_EMAIL')"
  "COMPANY_GST=$(Get-EnvValue 'COMPANY_GST')"
)

$adminEnv = @(
  "NEXT_PUBLIC_API_URL=$(Get-EnvValue 'API_BASE_URL' 'http://localhost:3001/api/v1')"
  "NEXT_PUBLIC_APP_NAME=$(Get-EnvValue 'NEXT_PUBLIC_APP_NAME' 'GM Silver Admin')"
)

$mobileEnv = @(
  "EXPO_PUBLIC_API_URL=$(Get-EnvValue 'API_BASE_URL' 'http://localhost:3001/api/v1')"
  "EXPO_PUBLIC_FCM_SENDER_ID=$(Get-EnvValue 'FCM_SENDER_ID')"
)

Set-Content -Path (Join-Path $RootPath 'backend/.env') -Value $backendEnv -Encoding UTF8
Set-Content -Path (Join-Path $RootPath 'admin-panel/.env') -Value $adminEnv -Encoding UTF8
Set-Content -Path (Join-Path $RootPath 'mobile/.env') -Value $mobileEnv -Encoding UTF8

Write-Host '[sync-env] Updated backend/.env, admin-panel/.env, mobile/.env from .env.shared.' -ForegroundColor Green
