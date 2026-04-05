@echo off
echo ========================================
echo   CALI - Certification Automation Tool
echo ========================================
echo.

:: Start backend
echo [1/2] Starting backend (FastAPI)...
cd /d "%~dp0backend"
start "CALI Backend" cmd /k "pip install -r requirements.txt >nul 2>&1 && python -m uvicorn main:app --reload --port 8000"

:: Start frontend
echo [2/2] Starting frontend (Vite + React)...
cd /d "%~dp0frontend"
start "CALI Frontend" cmd /k "npm install >nul 2>&1 && npm run dev"

echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit this window...
pause >nul
