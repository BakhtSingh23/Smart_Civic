@echo off
echo =========================================
echo   Starting SmartCivic Platform (Windows)
echo =========================================

echo [1/4] Starting RASA action server on port 5055...
start "RASA Actions" cmd /k "cd rasa_bot && rasa_env\Scripts\activate && rasa run actions --port 5055"

echo [2/4] Starting RASA server on port 5005...
start "RASA Server" cmd /k "cd rasa_bot && rasa_env\Scripts\activate && rasa run --enable-api --cors * --port 5005"

echo [3/4] Starting Node.js backend on port 5000...
start "Node Backend" cmd /k "cd server && node index.js"

echo [4/4] Starting React frontend on port 5173...
start "React Frontend" cmd /k "cd client && npm run dev"

echo.
echo =========================================
echo   All servers started!
echo =========================================
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000
echo   RASA:      http://localhost:5005
echo   Actions:   http://localhost:5055
echo =========================================
