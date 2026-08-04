# Run Android build (Windows) — avoids Downloads Gradle lock errors
# Usage: from repo root or mobile folder:  pwsh ./mobile/scripts/run-android.ps1

$ErrorActionPreference = 'Stop'

$mobileRoot = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path (Join-Path $mobileRoot 'android'))) {
  $mobileRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'mobile'
}
$androidDir = Join-Path $mobileRoot 'android'

$env:JAVA_HOME = 'C:\Users\9389c\.jdks\jbr-21.0.11'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:GRADLE_USER_HOME = 'C:\gradle-caches\user'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

# Keep project .gradle outside Downloads (OneDrive/antivirus locks)
$projectGradle = 'C:\gradle-caches\gmsilver-android-project'
New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null
New-Item -ItemType Directory -Force -Path $projectGradle | Out-Null

$link = Join-Path $androidDir '.gradle'
$item = Get-Item $link -Force -ErrorAction SilentlyContinue
if ($null -eq $item) {
  cmd /c "mklink /J `"$link`" `"$projectGradle`"" | Out-Null
} elseif (-not $item.Attributes.ToString().Contains('ReparsePoint')) {
  Remove-Item -LiteralPath $link -Recurse -Force
  cmd /c "mklink /J `"$link`" `"$projectGradle`"" | Out-Null
}

Set-Location $mobileRoot
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Host "Starting Metro + Android build..."
npx react-native run-android
