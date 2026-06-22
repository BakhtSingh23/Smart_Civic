#!/bin/bash
echo "========================================="
echo "  Starting SmartCivic Platform (Linux/Mac)"
echo "========================================="

# Start Node.js backend
echo "[1/2] Starting Node.js backend on port 5000..."
cd server
node index.js &
NODE_PID=$!
cd ..

sleep 3

# Start React frontend
echo "[2/2] Starting React frontend on port 5173..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo ""
echo "========================================="
echo "  All servers started!"
echo "========================================="
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:5000"
echo "========================================="
echo ""
echo "  Chatbot is now powered by Google Gemini AI."
echo "  Ensure GEMINI_API_KEY is set in server/.env"
echo "========================================="

# Wait for both processes
wait $NODE_PID $CLIENT_PID
