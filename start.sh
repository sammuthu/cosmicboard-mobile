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

# Step 4: Kill any existing Metro bundler and Expo processes
print_status "Cleaning up any existing Metro/Expo processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "react-native" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
if lsof -Pi :${METRO_PORT} -sTCP:LISTEN -t >/dev/null ; then
    print_status "Stopping existing Metro bundler on port ${METRO_PORT}..."
    lsof -ti:${METRO_PORT} | xargs kill -9 2>/dev/null || true
    sleep 2
fi
if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null ; then
    print_status "Stopping existing web server on port 8082..."
    lsof -ti:8082 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
print_success "Cleanup complete"

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

# Step 6: Launch web browser and iOS simulator
launch_development() {
    print_status "Launching development environment..."
    
    # First, start Metro bundler for iOS/Android (MUST be on 8081)
    print_status "Starting Metro bundler on port 8081 (clearing cache)..."
    npx expo start --clear --port 8081 > /tmp/metro.log 2>&1 &
    METRO_PID=$!
    
    # Wait for Metro to be fully ready
    print_status "Waiting for Metro bundler to start..."
    for i in {1..20}; do
        if curl -s http://localhost:8081/status > /dev/null 2>&1; then
            print_success "Metro bundler is ready on port 8081!"
            break
        fi
        if [ $i -eq 20 ]; then
            print_error "Metro bundler failed to start. Check /tmp/metro.log for details"
            tail -20 /tmp/metro.log
            exit 1
        fi
        sleep 1
    done
    
    # Then start web version on port 8082
    print_status "Starting web server on port 8082..."
    npx expo start --web --port 8082 > /tmp/web.log 2>&1 &
    WEB_PID=$!
    
    # Give web server time to start
    sleep 3
    
    # Verify Metro is accessible
    print_status "Verifying Metro bundler accessibility..."
    if curl -s http://localhost:8081 > /dev/null 2>&1; then
        print_success "Metro bundler is accessible at http://localhost:8081"
    else
        print_error "Metro bundler is not accessible!"
        print_status "Attempting to restart Metro..."
        kill $METRO_PID 2>/dev/null || true
        npx expo start --clear --port 8081 > /tmp/metro.log 2>&1 &
        METRO_PID=$!
        sleep 5
    fi
    
    # Open web browser
    if lsof -Pi :8082 -sTCP:LISTEN -t >/dev/null ; then
        print_success "Opening web browser at http://localhost:8082"
        open http://localhost:8082
    fi
    
    # Open iOS Simulator
    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Opening iOS Simulator..."
        
        # Open Simulator app if not already running
        if ! pgrep -x "Simulator" > /dev/null; then
            open -a Simulator
            sleep 3
        fi
        
        # Select appropriate simulator
        if xcrun simctl list devices | grep -q "iPhone 16 Plus"; then
            DEVICE_NAME="iPhone 16 Plus"
        elif xcrun simctl list devices | grep -q "iPhone 16 Pro Max"; then
            DEVICE_NAME="iPhone 16 Pro Max"
        elif xcrun simctl list devices | grep -q "iPhone 15 Pro Max"; then
            DEVICE_NAME="iPhone 15 Pro Max"
        else
            DEVICE_NAME="iPhone 14 Pro Max"
        fi
        
        print_success "Using simulator: $DEVICE_NAME"
        
        # Make sure Metro is still running before launching app
        if ! curl -s http://localhost:8081/status > /dev/null 2>&1; then
            print_warning "Metro bundler stopped. Restarting..."
            npx expo start --clear --port 8081 > /tmp/metro.log 2>&1 &
            METRO_PID=$!
            sleep 5
        fi
        
        # Open Expo Go or build native app
        print_status "Launching iOS app..."
        
        # Use Expo CLI to open on iOS simulator (will use the Metro bundler on 8081)
        npx expo run:ios --port 8081
    fi
}

# Step 7: Start based on platform preference
if [ "$1" = "ios" ] || [ "$2" = "ios" ]; then
    print_status "Starting iOS app only..."
    npm run ios
elif [ "$1" = "android" ] || [ "$2" = "android" ]; then
    print_status "Starting Android app only..."
    npm run android
elif [ "$1" = "web" ] || [ "$2" = "web" ]; then
    print_status "Starting web version only..."
    npx expo start --web --port 8082
else
    # Default: Launch both web and iOS
    launch_development
fi

# Cleanup function
cleanup() {
    print_warning "Shutting down services..."
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null || true
    fi
    if [ ! -z "$METRO_PID" ]; then
        kill $METRO_PID 2>/dev/null || true
    fi
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "metro" 2>/dev/null || true
    lsof -ti:8082 | xargs kill -9 2>/dev/null || true
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    print_success "Cleanup complete"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM