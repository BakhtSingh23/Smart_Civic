@echo off
echo =========================================
echo   Starting SmartCivic Platform (Windows)
echo =========================================

echo [1/2] Starting Node.js backend on port 5000...
start "Node Backend" cmd /k "cd server && node index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React frontend on port 5173...
start "React Frontend" cmd /k "cd client && npm run dev"

echo.
echo =========================================
echo   All servers started!
echo =========================================
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo =========================================
echo.
echo   Chatbot is now powered by Google Gemini AI.
echo   Ensure GEMINI_API_KEY is set in server/.env
echo =========================================
