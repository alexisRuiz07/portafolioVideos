@echo off
title Portafolio thealex - puertos
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\ver-puertos.ps1"
pause
