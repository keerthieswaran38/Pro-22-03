@echo off
echo Starting the Gagner Sports Backend...
cd UI
start "Gagner Backend" node server.cjs
echo Starting the UI dev server on port 3008...
call npm run dev -- --port 3008
pause
