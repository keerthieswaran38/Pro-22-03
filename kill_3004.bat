@echo off
echo Finding and killing process on port 3004...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :3004') DO (
    echo Killing process with PID: %%T
    TaskKill.exe /PID %%T /F
)
echo Done.
pause
