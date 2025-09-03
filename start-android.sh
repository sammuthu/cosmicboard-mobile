#!/bin/bash

# CosmicBoard Android Development Setup Script
# This script handles Android emulator setup and app launching

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
ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"
EMULATOR_NAME="Pixel_8_Pro_API_34"

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

print_status "Starting ${APP_NAME} for Android..."

# Step 1: Check if Android SDK is installed
check_android_sdk() {
    print_status "Checking Android SDK installation..."
    
    if [ ! -d "$ANDROID_HOME" ]; then
        print_error "Android SDK not found at $ANDROID_HOME"
        print_status "Installing Android SDK via Homebrew..."
        
        # Check if Homebrew is installed
        if ! command -v brew &> /dev/null; then
            print_error "Homebrew not installed. Please install from https://brew.sh"
            exit 1
        fi
        
        # Install Android command line tools
        brew install --cask android-commandlinetools
        
        # Set up ANDROID_HOME
        export ANDROID_HOME="$HOME/Library/Android/sdk"
        echo 'export ANDROID_HOME="$HOME/Library/Android/sdk"' >> ~/.zshrc
        echo 'export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"' >> ~/.zshrc
        source ~/.zshrc
        
        print_success "Android SDK installed"
    else
        print_success "Android SDK found at $ANDROID_HOME"
    fi
    
    # Ensure paths are set
    export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools:$PATH"
}

# Step 2: Install Android SDK components
install_sdk_components() {
    print_status "Checking Android SDK components..."
    
    # Check if sdkmanager exists
    if command -v sdkmanager &> /dev/null; then
        print_status "Installing/updating Android SDK components..."
        
        # Accept licenses
        yes | sdkmanager --licenses > /dev/null 2>&1 || true
        
        # Install required SDK components
        sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "system-images;android-34;google_apis;x86_64" "emulator" > /dev/null 2>&1
        
        print_success "Android SDK components installed"
    else
        print_error "sdkmanager not found. Please check Android SDK installation"
    fi
}

# Step 3: Create Android emulator if it doesn't exist
create_emulator() {
    print_status "Checking for Android emulator..."
    
    # Check if emulator exists
    if ! $ANDROID_HOME/emulator/emulator -list-avds | grep -q "$EMULATOR_NAME"; then
        print_status "Creating Android emulator: $EMULATOR_NAME"
        
        # Create AVD
        echo "no" | $ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd \
            -n "$EMULATOR_NAME" \
            -k "system-images;android-34;google_apis;x86_64" \
            -d "pixel_8_pro" \
            --force > /dev/null 2>&1
        
        print_success "Emulator created: $EMULATOR_NAME"
    else
        print_success "Emulator already exists: $EMULATOR_NAME"
    fi
}

# Step 4: Start Android emulator
start_emulator() {
    print_status "Checking if Android emulator is running..."
    
    if adb devices 2>/dev/null | grep -q "emulator"; then
        print_success "Android emulator is already running"
    else
        print_status "Starting Android emulator..."
        
        # Start emulator in background
        nohup $ANDROID_HOME/emulator/emulator -avd "$EMULATOR_NAME" -no-snapshot-load > /tmp/emulator.log 2>&1 &
        EMULATOR_PID=$!
        
        print_status "Waiting for emulator to boot (this may take a few minutes)..."
        
        # Wait for emulator to be ready
        for i in {1..60}; do
            if adb devices 2>/dev/null | grep -q "emulator.*device$"; then
                # Additional check for boot completion
                if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
                    print_success "Android emulator is ready!"
                    break
                fi
            fi
            
            if [ $i -eq 60 ]; then
                print_error "Emulator failed to start after 60 seconds"
                print_status "Check /tmp/emulator.log for errors"
                exit 1
            fi
            
            echo -n "."
            sleep 2
        done
        echo ""
    fi
}

# Step 5: Check backend server
check_backend() {
    if [ "$1" != "--no-backend" ]; then
        print_status "Checking backend server..."
        
        if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
            print_success "Backend server is running on port ${BACKEND_PORT}"
        else
            print_warning "Backend server not running. Starting backend..."
            
            # Check PostgreSQL first
            if docker ps 2>/dev/null | grep -q "cosmicboard_postgres"; then
                print_success "PostgreSQL is running"
            else
                print_status "Starting PostgreSQL..."
                (cd ../cosmicboard-backend && docker compose up -d) || true
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
                    print_warning "Backend may not be fully ready, continuing anyway..."
                fi
                sleep 1
            done
        fi
    fi
}

# Step 6: Install app dependencies
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
}

# Step 7: Clean and start Metro bundler
start_metro() {
    print_status "Cleaning up any existing Metro/Expo processes..."
    
    # Kill existing processes
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "react-native" 2>/dev/null || true
    pkill -f "metro" 2>/dev/null || true
    
    # Kill processes on Metro port
    if lsof -Pi :${METRO_PORT} -sTCP:LISTEN -t >/dev/null 2>/dev/null; then
        lsof -ti:${METRO_PORT} | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 2
    
    print_status "Starting Metro bundler..."
    npx expo start --clear --port ${METRO_PORT} > /tmp/metro-android.log 2>&1 &
    METRO_PID=$!
    
    # Wait for Metro to be ready
    print_status "Waiting for Metro bundler to start..."
    for i in {1..20}; do
        if curl -s http://localhost:${METRO_PORT}/status > /dev/null 2>&1; then
            print_success "Metro bundler is ready!"
            break
        fi
        if [ $i -eq 20 ]; then
            print_error "Metro bundler failed to start"
            tail -20 /tmp/metro-android.log
            exit 1
        fi
        sleep 1
    done
}

# Step 8: Configure Android device for backend access
configure_device() {
    print_status "Configuring Android device for backend access..."
    
    # Set up reverse port forwarding for backend
    adb reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT} 2>/dev/null || true
    
    # Set up reverse port forwarding for Metro
    adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT} 2>/dev/null || true
    
    print_success "Device configured for local development"
}

# Step 9: Launch the app
launch_app() {
    print_status "Building and launching Android app..."
    
    # Build and run the Android app
    npx expo run:android --port ${METRO_PORT}
}

# Main execution flow
main() {
    echo ""
    echo "========================================="
    echo "   CosmicBoard Android Development"
    echo "========================================="
    echo ""
    
    # Run setup steps
    check_android_sdk
    install_sdk_components
    create_emulator
    start_emulator
    check_backend "$@"
    install_dependencies
    configure_device
    start_metro
    
    # Display status
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
    
    # Check Metro bundler
    echo -n "Metro Bundler (port ${METRO_PORT}): "
    if curl -s http://localhost:${METRO_PORT}/status > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi
    
    # Check Android emulator
    echo -n "Android Emulator: "
    if adb devices 2>/dev/null | grep -q "emulator.*device$"; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi
    
    echo ""
    print_status "Access Information:"
    echo "-------------------"
    echo -e "Backend API:      ${GREEN}http://localhost:${BACKEND_PORT}/api${NC}"
    echo -e "Metro Bundler:    ${GREEN}http://localhost:${METRO_PORT}${NC}"
    echo ""
    
    # Launch the app
    launch_app
}

# Cleanup function
cleanup() {
    print_warning "Shutting down services..."
    
    if [ ! -z "$METRO_PID" ]; then
        kill $METRO_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Clean up port forwarding
    adb reverse --remove tcp:${BACKEND_PORT} 2>/dev/null || true
    adb reverse --remove tcp:${METRO_PORT} 2>/dev/null || true
    
    print_success "Cleanup complete"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM

# Run main function
main "$@"