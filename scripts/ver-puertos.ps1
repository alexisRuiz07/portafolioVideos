# Muestra en que puertos esta corriendo el portafolio
$root = Split-Path -Parent $PSScriptRoot
$ip = & (Join-Path $PSScriptRoot 'ip-local.ps1')

$procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine.Contains($root) }
$ids = @($procs | ForEach-Object { $_.ProcessId })

$ports = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ids -contains $_.OwningProcess -and $_.LocalPort -lt 10000 } |
  Select-Object -ExpandProperty LocalPort -Unique | Sort-Object

Write-Host ''
if (-not $ports) {
  Write-Host '  El portafolio NO esta corriendo.' -ForegroundColor Yellow
  Write-Host '  Haz doble clic en iniciar.bat para arrancarlo.'
} else {
  Write-Host '  El portafolio esta corriendo en:' -ForegroundColor Green
  foreach ($p in $ports) {
    Write-Host ''
    Write-Host "   Puerto $p"
    Write-Host "     En este PC:  http://localhost:$p"
    Write-Host "     Panel:       http://localhost:$p/admin"
    Write-Host "     Celular:     http://${ip}:$p   (misma red wifi)"
  }
}
Write-Host ''
