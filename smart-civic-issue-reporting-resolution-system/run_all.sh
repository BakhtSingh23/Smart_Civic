#!/bin/bash
echo "========================================="
echo "  Starting SmartCivic Platform"
echo "========================================="

# Start RASA action server
echo "[1/4] Starting RASA action server on port 5055..."
cd rasa_bot
source rasa_env/bin/activate
rasa run actions --port 5055 &
ACTIONS_PID=$!

# Start RASA server
echo "[2/4] Starting RASA server on port 5005..."
rasa run --enable-api --cors "*" --port 5005 &
RASA_PID=$!

# Start Node.js backend
echo "[3/4] Starting Node.js backend on port 5000..."
cd ../server
node index.js &
NODE_PID=$!

# Start React frontend
echo "[4/4] Starting React frontend on port 5173..."
cd ../client
npm run dev &

echo ""
echo "========================================="
echo "  All servers started!"
echo "========================================="
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:5000"
echo "  RASA:      http://localhost:5005"
echo "  Actions:   http://localhost:5055"
echo "========================================="

wait
