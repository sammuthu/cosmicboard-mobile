#!/bin/bash

# CosmicBoard Mobile App Startup Script
# This script handles the startup process for the React Native mobile app

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="CosmicBoard Mobile"
BACKEND_PORT=7778
METRO_PORT=8081

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting ${APP_NAME}..."

# Step 1: Check if backend is needed (default yes, unless --no-backend flag)
if [ "$1" != "--no-backend" ]; then
    # Check if backend is running
    print_status "Checking backend server..."
    if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        print_success "Backend server is already running on port ${BACKEND_PORT}"
    else
        print_status "Backend server not running. Starting backend..."
        
        # Check PostgreSQL first
        if docker ps | grep -q "cosmicboard_postgres"; then
            print_success "PostgreSQL is running"
        else
            print_status "Starting PostgreSQL..."
            (cd ../cosmicboard-backend && docker compose up -d)
            sleep 5
        fi
        
        # Start backend server in background
        print_status "Starting backend server..."
        (cd ../cosmicboard-backend && npm run dev > /dev/null 2>&1) &
        BACKEND_PID=$!
        
        # Wait for backend to be ready
        print_status "Waiting for backend to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
                print_success "Backend is ready!"
                break
            fi
            if [ $i -eq 30 ]; then
                print_error "Backend failed to start after 30 seconds"
                exit 1
            fi
            sleep 1
        done
    fi
fi

# Step 2: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies already installed"
fi

# Step 3: Check if CocoaPods needs to be installed (iOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ ! -d "ios/Pods" ]; then
        print_status "Installing iOS pods..."
        cd ios && pod install && cd ..
        print_success "iOS pods installed"
    else
        print_success "iOS pods already installed"
    fi
fi

# Step 4: Kill any existing Metro bundler
if lsof -Pi :${METRO_PORT} -sTCP:LISTEN -t >/dev/null ; then
    print_status "Stopping existing Metro bundler on port ${METRO_PORT}..."
    lsof -ti:${METRO_PORT} | xargs kill -9 2>/dev/null || true
    sleep 1
    print_success "Previous Metro bundler stopped"
fi

# Step 5: Service Status
echo ""
print_status "Service Status:"
echo "-------------------"

# Check backend
echo -n "Backend API (port ${BACKEND_PORT}): "
if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
fi

# Check if simulators are available
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -n "iOS Simulator: "
    if xcrun simctl list devices | grep -q "Booted"; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ Not running (run 'npm run ios' to start)${NC}"
    fi
fi

# Check if Android emulator is running
echo -n "Android Emulator: "
if adb devices 2>/dev/null | grep -q "emulator\|device"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not running (run 'npm run android' to start)${NC}"
fi

echo ""
print_status "Access Information:"
echo "-------------------"
echo -e "Backend API:      ${GREEN}http://localhost:${BACKEND_PORT}/api${NC}"
echo -e "Metro Bundler:    ${GREEN}http://localhost:${METRO_PORT}${NC}"
echo ""
print_status "Available Commands:"
echo "-------------------"
echo -e "${BLUE}npm run ios${NC}       - Run on iOS Simulator"
echo -e "${BLUE}npm run android${NC}   - Run on Android Emulator"
echo -e "${BLUE}npm start${NC}         - Start Metro Bundler only"
echo ""

# Step 6: Start based on platform preference
if [ "$1" = "ios" ] || [ "$2" = "ios" ]; then
    print_status "Starting iOS app..."
    npm run ios
elif [ "$1" = "android" ] || [ "$2" = "android" ]; then
    print_status "Starting Android app..."
    npm run android
else
    print_status "Starting Metro Bundler..."
    print_status "Run 'npm run ios' or 'npm run android' in another terminal to launch the app"
    echo ""
    print_status "Press Ctrl+C to stop the bundler"
    echo ""
    npm start
fi