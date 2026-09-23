#Requires -RunAsAdministrator
$ErrorActionPreference = "Stop"
$listen = Get-NetTCPConnection -LocalPort 8512 -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $listen) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
& "$PSScriptRoot\install-forms-service.ps1"
Restart-Service AirvectorCloudflared
Write-Host "Tunnel restarted. https://forms.airvector-os.com/paintline/"
