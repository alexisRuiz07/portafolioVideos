# Devuelve el primer puerto libre a partir de 3000
$p = 3000
while (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) { $p++ }
$p
