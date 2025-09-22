#!/bin/bash

# Quick fix script for Android development issues
# Run this when the app gets stuck on "Reloading..." or DevTools disconnects

set -e

echo "🔧 Fixing Android development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Killing existing processes...${NC}"
pkill -f "expo|metro" 2>/dev/null || true
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
sleep 2

echo -e "${YELLOW}Step 2: Checking backend...${NC}"
if curl -s http://localhost:7779/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend not responding. Starting backend...${NC}"
    cd ../cosmicboard-backend && npm run dev > /tmp/backend.log 2>&1 &
    sleep 5
fi

echo -e "${YELLOW}Step 3: Resetting port forwarding...${NC}"
adb reverse --remove-all 2>/dev/null || true
sleep 1
adb reverse tcp:7779 tcp:7779
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082

# Verify forwarding
if adb reverse --list | grep -q "7779"; then
    echo -e "${GREEN}✓ Backend port forwarding configured${NC}"
else
    echo -e "${YELLOW}⚠ Backend port forward failed, retrying...${NC}"
    adb reverse tcp:7779 tcp:7779
fi

if adb reverse --list | grep -q "8081"; then
    echo -e "${GREEN}✓ Metro port forwarding configured${NC}"
else
    echo -e "${YELLOW}⚠ Metro port forward failed, retrying...${NC}"
    adb reverse tcp:8081 tcp:8081
fi

echo "Current port forwards:"
adb reverse --list | sed 's/^/  /'

echo -e "${YELLOW}Step 4: Starting Metro bundler...${NC}"
npx expo start --clear --port 8081 > /tmp/metro-fix.log 2>&1 &
METRO_PID=$!

# Wait for Metro to be ready
echo -n "Waiting for Metro bundler"
for i in {1..30}; do
    if curl -s http://localhost:8081/status > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✓ Metro bundler is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

echo -e "${YELLOW}Step 5: Restarting app...${NC}"
adb shell am force-stop com.sammuthu.cosmicboard
sleep 2
adb shell am start -n com.sammuthu.cosmicboard/.MainActivity
echo -e "${GREEN}✓ App restarted${NC}"

echo ""
echo -e "${GREEN}✅ Fixed! The app should now be loading.${NC}"
echo ""
echo "If DevTools is disconnected:"
echo "1. Press Cmd+M in the emulator"
echo "2. Select 'Open DevTools'"
echo "3. Click 'Reconnect DevTools' in the browser"