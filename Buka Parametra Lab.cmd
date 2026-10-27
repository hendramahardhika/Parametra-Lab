@echo off
setlocal
cd /d "%~dp0"
set "PARAMETRA_NODE=%LOCALAPPDATA%\hermes\node\node.exe"
if exist "%PARAMETRA_NODE%" goto launch
set "PARAMETRA_NODE=node"
:launch
echo Parametra Lab - tunggu sampai alamat lokal tampil.
echo Buka http://localhost:5173 di browser. Tutup jendela ini untuk berhenti.
"%PARAMETRA_NODE%" scripts/run-framework.mjs dev
pause
