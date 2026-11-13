# IP de este PC en la red wifi/local (para abrir el portafolio desde el celular).
# Usa la interfaz que tiene puerta de enlace (la que sale a internet).
$ip = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
  ForEach-Object { $_.IPv4Address.IPAddress } |
  Where-Object { $_ -and $_ -notlike '169.254.*' } |
  Select-Object -First 1
if ($ip) { $ip } else { 'localhost' }
