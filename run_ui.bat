@echo off
echo Starting the Gagner Sports Backend...
cd UI
start "Gagner Backend" node server.cjs
echo Starting the UI dev server...
call npm run dev
pause
