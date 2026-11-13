@echo off
title Portafolio thealex (desarrollo)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [!] No encuentro Node.js. Instalalo desde https://nodejs.org y vuelve a intentarlo.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Instalando dependencias por primera vez, espera un momento...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)

for /f %%p in ('powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\puerto-libre.ps1"') do set PORT=%%p
for /f %%i in ('powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\ip-local.ps1"') do set LANIP=%%i

cls
echo.
echo  ==============================================================
echo    PORTAFOLIO THEALEX  -  corriendo en el PUERTO %PORT%
echo  ==============================================================
echo.
echo    Portafolio:   http://localhost:%PORT%
echo    Panel:        http://localhost:%PORT%/admin
echo    Celular:      http://%LANIP%:%PORT%   (misma red wifi)
echo.
echo    Para detenerlo: cierra esta ventana o pulsa Ctrl+C
echo  ==============================================================
echo.

rem Abre el navegador cuando el servidor este listo
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){try{Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:%PORT% | Out-Null; Start-Process http://localhost:%PORT%; break}catch{Start-Sleep 1}}"

call npx next dev -p %PORT%
pause
