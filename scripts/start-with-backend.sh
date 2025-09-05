#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_DIR="../cosmicboard-backend"
MOBILE_DIR="."

echo -e "${YELLOW}Starting CosmicBoard Backend and Mobile App...${NC}"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    echo "Please ensure cosmicboard-backend is in the parent directory"
    exit 1
fi

# Function to kill processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend server stopped${NC}"
    fi
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd "$BACKEND_DIR"

# Check if node_modules exists in backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start backend in background and capture PID
npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to start on port 7778...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:7778/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running on port 7778${NC}"
        break
    fi
    sleep 1
    ATTEMPTS=$((ATTEMPTS + 1))
    echo -n "."
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo -e "\n${RED}Backend failed to start. Check the logs above.${NC}"
    exit 1
fi

# Return to mobile directory and start Expo
cd "../cosmicboard-mobile"
echo -e "${GREEN}Starting Expo development server...${NC}"

# Pass through the platform argument if provided
if [ "$1" = "ios" ]; then
    expo run:ios
elif [ "$1" = "android" ]; then
    expo run:android
elif [ "$1" = "web" ]; then
    expo start --web
else
    expo start
fi