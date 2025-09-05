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
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
EMULATOR_NAME="Pixel_8_Pro_API_34"
PROJECT_DIR="$(dirname "$0")"

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
    
    # Try common Android SDK locations
    if [ ! -d "$ANDROID_HOME" ]; then
        if [ -d "$HOME/Library/Android/sdk" ]; then
            export ANDROID_HOME="$HOME/Library/Android/sdk"
        elif [ -d "/opt/homebrew/share/android-commandlinetools" ]; then
            export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
        else
            print_error "Android SDK not found"
            print_status "Please install Android Studio or run: brew install --cask android-commandlinetools"
            exit 1
        fi
    fi
    
    print_success "Android SDK found at $ANDROID_HOME"
    
    # Ensure paths are set
    export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"
}

# Step 2: Install Android SDK components
install_sdk_components() {
    print_status "Checking Android SDK components..."
    
    # Check if sdkmanager exists
    if command -v sdkmanager &> /dev/null; then
        print_status "Installing/updating Android SDK components..."
        
        # Accept licenses
        yes | sdkmanager --licenses > /dev/null 2>&1 || true
        
        # Determine system architecture for emulator image
        ARCH=$(uname -m)
        if [ "$ARCH" = "arm64" ]; then
            # For Apple Silicon Macs
            SYSTEM_IMAGE="system-images;android-34;google_apis;arm64-v8a"
        else
            # For Intel Macs
            SYSTEM_IMAGE="system-images;android-34;google_apis;x86_64"
        fi
        
        # Install required SDK components
        sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "$SYSTEM_IMAGE" "emulator" > /dev/null 2>&1 || true
        
        print_success "Android SDK components installed"
    else
        print_warning "sdkmanager not found. Skipping SDK component installation"
    fi
}

# Step 3: Create Android emulator if it doesn't exist
create_emulator() {
    print_status "Checking for Android emulator..."
    
    # Check if emulator command exists
    if [ ! -f "$ANDROID_HOME/emulator/emulator" ]; then
        print_warning "Emulator not found. Please install via Android Studio"
        return
    fi
    
    # Check if emulator exists
    if ! $ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null | grep -q "$EMULATOR_NAME"; then
        print_status "Creating Android emulator: $EMULATOR_NAME"
        
        # Determine system architecture
        ARCH=$(uname -m)
        if [ "$ARCH" = "arm64" ]; then
            SYSTEM_IMAGE="system-images;android-34;google_apis;arm64-v8a"
        else
            SYSTEM_IMAGE="system-images;android-34;google_apis;x86_64"
        fi
        
        # Try to create AVD
        if command -v avdmanager &> /dev/null; then
            echo "no" | avdmanager create avd \
                -n "$EMULATOR_NAME" \
                -k "$SYSTEM_IMAGE" \
                -d "pixel_8_pro" \
                --force > /dev/null 2>&1 || print_warning "Could not create emulator. Please create manually in Android Studio"
        else
            print_warning "avdmanager not found. Please create emulator manually in Android Studio"
        fi
    else
        print_success "Emulator already exists: $EMULATOR_NAME"
    fi
}

# Step 4: Start Android emulator
start_emulator() {
    print_status "Checking if Android emulator is running..."
    
    if ! command -v adb &> /dev/null; then
        print_warning "adb not found. Skipping emulator check"
        return
    fi
    
    if adb devices 2>/dev/null | grep -q "emulator"; then
        print_success "Android emulator is already running"
    else
        # Check if we have an emulator to start
        if [ -f "$ANDROID_HOME/emulator/emulator" ] && $ANDROID_HOME/emulator/emulator -list-avds 2>/dev/null | grep -q "$EMULATOR_NAME"; then
            print_status "Starting Android emulator..."
            
            # Start emulator in background
            nohup $ANDROID_HOME/emulator/emulator -avd "$EMULATOR_NAME" -no-snapshot-load > /tmp/emulator.log 2>&1 &
            EMULATOR_PID=$!
            
            print_status "Waiting for emulator to boot (this may take a few minutes)..."
            
            # Wait for emulator to be ready
            for i in {1..90}; do
                if adb devices 2>/dev/null | grep -q "emulator.*device$"; then
                    # Additional check for boot completion
                    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
                        print_success "Android emulator is ready!"
                        break
                    fi
                fi
                
                if [ $i -eq 90 ]; then
                    print_warning "Emulator may not be fully ready. You can check /tmp/emulator.log for details"
                    break
                fi
                
                echo -n "."
                sleep 2
            done
            echo ""
        else
            print_warning "No emulator found. Please start one from Android Studio"
        fi
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

# Step 6: Install app dependencies and check API configuration
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
    
    # Check if API is configured correctly for Android
    print_status "Verifying Android API configuration..."
    if grep -q "10.0.2.2:${BACKEND_PORT}" "$PROJECT_DIR/src/services/api.ts"; then
        print_success "API correctly configured for Android emulator"
    else
        print_warning "API may not be configured for Android. Checking..."
        if grep -q "Platform.OS === 'android'" "$PROJECT_DIR/src/services/api.ts"; then
            print_success "API has Android-specific configuration"
        else
            print_warning "API might need Android-specific configuration for 10.0.2.2"
        fi
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

# Step 9: Build and launch the app
build_and_launch_app() {
    print_status "Checking if app needs to be rebuilt..."
    
    # Check if the app is already installed
    if adb shell pm list packages 2>/dev/null | grep -q "com.sammuthu.cosmicboard"; then
        print_status "App already installed. Launching..."
        
        # Launch the app
        adb shell am start -n com.sammuthu.cosmicboard/.MainActivity 2>/dev/null || true
        
        # Reload the app to ensure latest code
        sleep 2
        adb shell input keyevent 82 2>/dev/null || true  # Open dev menu
        sleep 1
        adb shell input keyevent 82 2>/dev/null || true  # Try again if needed
        
        print_success "App launched! If you see a white screen, press 'r' in Metro terminal to reload"
    else
        print_status "Building and installing Android app (this may take a few minutes)..."
        
        # Clean build if requested
        if [ "$1" = "--clean" ]; then
            print_status "Cleaning build cache..."
            cd android && ./gradlew clean && cd ..
        fi
        
        # Build and run the Android app
        npx expo run:android --port ${METRO_PORT}
    fi
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
    
    # Build and launch the app
    build_and_launch_app "$@"
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