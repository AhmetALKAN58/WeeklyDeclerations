#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Build the paint-line form and install it as a Windows service on port 8512.
  Does not restart Streamlit, the kiosk, Order Flow, or the Cloudflare tunnel.
#>
$ErrorActionPreference = "Stop"

$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$LogsDir = Join-Path $PSScriptRoot "logs"
$ServiceName = "AirvectorForms"
$LoggingDeploy = "C:\Users\zmason\Documents\CODE\logging_db\deploy"

function Get-NssmPath {
    $bundled = Join-Path $LoggingDeploy "tools\nssm.exe"
    if (Test-Path -LiteralPath $bundled) {
        return (Resolve-Path -LiteralPath $bundled).Path
    }
    $cmd = Get-Command nssm -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($p in @(
            "${env:ProgramFiles}\NSSM\nssm.exe",
            "${env:ProgramFiles(x86)}\NSSM\nssm.exe"
        )) {
        if (Test-Path -LiteralPath $p) { return $p }
    }
    return $null
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { throw "node is not on PATH" }
$nssm = Get-NssmPath
if (-not $nssm) { throw "NSSM not found. Run logging_db deploy\install-nssm.ps1" }

Set-Location $AppRoot
if (-not (Test-Path (Join-Path $AppRoot "node_modules"))) {
    npm install
}
npm run build

New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

$svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($svc) {
    if ($svc.Status -eq "Running") { Stop-Service $ServiceName -Force }
    & $nssm remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

$server = Join-Path $AppRoot "server.mjs"
Write-Host "Installing $ServiceName..."
& $nssm install $ServiceName $node $server
& $nssm set $ServiceName AppDirectory $AppRoot
& $nssm set $ServiceName DisplayName "Airvector Forms"
& $nssm set $ServiceName Description "Shop forms on port 8512 (forms.airvector-os.com/paintline)"
& $nssm set $ServiceName Start SERVICE_AUTO_START
& $nssm set $ServiceName AppStdout (Join-Path $LogsDir "forms-stdout.log")
& $nssm set $ServiceName AppStderr (Join-Path $LogsDir "forms-stderr.log")
& $nssm set $ServiceName AppRotateFiles 1
& $nssm set $ServiceName AppRotateBytes 10485760
& $nssm set $ServiceName AppExit Default Restart
& $nssm set $ServiceName AppRestartDelay 5000

Start-Service $ServiceName
Write-Host "Started $ServiceName - http://127.0.0.1:8512/paintline/"
Write-Host "Public: https://forms.airvector-os.com/paintline/"
Write-Host "Add tunnel DNS once, then restart AirvectorCloudflared:"
Write-Host "  cloudflared tunnel route dns airvector-logging-db forms.airvector-os.com"
Write-Host "  Restart-Service AirvectorCloudflared"
