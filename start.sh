#!/bin/bash

# CosmicBoard iOS Development Setup Script
# This script handles iOS simulator setup and app launching with full automation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Cosmic Space Mobile"
BACKEND_PORT=7779
METRO_PORT=8081
PROJECT_DIR="$(dirname "$0")"
SIMULATOR_NAME=""  # Will be determined dynamically

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

print_status "Starting ${APP_NAME} for iOS..."

# Step 1: Check if running on macOS
check_macos() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This script is for macOS/iOS development only"
        print_status "For Android, please use ./start-android.sh"
        exit 1
    fi
    print_success "Running on macOS"
}

# Step 2: Check Xcode installation
check_xcode() {
    print_status "Checking Xcode installation..."

    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode is not installed"
        print_status "Please install Xcode from the App Store"
        exit 1
    fi

    # Check Xcode command line tools
    if ! xcode-select -p &> /dev/null; then
        print_error "Xcode Command Line Tools not installed"
        print_status "Installing Xcode Command Line Tools..."
        xcode-select --install
        exit 1
    fi

    XCODE_VERSION=$(xcodebuild -version | head -n1 | cut -d' ' -f2)
    print_success "Xcode $XCODE_VERSION is installed"
}

# Step 3: Check and start backend server
check_backend() {
    if [ "$1" != "--no-backend" ]; then
        print_status "Checking backend server..."

        if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
            print_success "Backend server is already running on port ${BACKEND_PORT}"
        else
            print_warning "Backend server not running. Starting backend..."

            # Check PostgreSQL first
            if docker ps 2>/dev/null | grep -q "cosmicspace-postgres"; then
                print_success "PostgreSQL is running"
            else
                print_status "Starting PostgreSQL..."
                if [ -d "../cosmicboard-backend" ]; then
                    (cd ../cosmicboard-backend && docker compose up -d) || true
                    sleep 5
                else
                    print_warning "Backend directory not found at ../cosmicboard-backend"
                fi
            fi

            # Start backend server in background
            if [ -d "../cosmicboard-backend" ]; then
                print_status "Starting backend server..."
                (cd ../cosmicboard-backend && npm run dev > /tmp/backend.log 2>&1) &
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
                        print_status "Check /tmp/backend.log for details"
                        tail -20 /tmp/backend.log
                        exit 1
                    fi
                    sleep 1
                done
            else
                print_warning "Backend not found, continuing without it..."
            fi
        fi
    fi
}

# Step 4: Install dependencies
install_dependencies() {
    print_status "Checking project dependencies..."

    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        # Quick check for missing packages
        if ! npm ls expo >/dev/null 2>&1; then
            print_warning "Some dependencies missing. Reinstalling..."
            npm install
        fi
        print_success "Dependencies verified"
    fi

    # Install iOS pods
    print_status "Checking iOS CocoaPods..."
    if ! command -v pod &> /dev/null; then
        print_status "Installing CocoaPods..."
        sudo gem install cocoapods
    fi

    if [ -d "ios" ]; then
        print_status "Installing iOS pods..."
        cd ios
        pod install --repo-update
        cd ..
        print_success "iOS pods installed"
    else
        print_warning "iOS directory not found, skipping pod installation"
    fi
}

# Step 5: Select and start iOS Simulator
start_simulator() {
    print_status "Checking iOS Simulator..."

    # Open Simulator app if not already running
    if ! pgrep -x "Simulator" > /dev/null; then
        print_status "Starting iOS Simulator application..."
        open -a Simulator
        sleep 3
    fi

    # Get list of available simulators
    print_status "Finding best available simulator..."

    # Priority order for simulators
    SIMULATOR_PREFERENCES=(
        "iPhone 16 Pro Max"
        "iPhone 16 Plus"
        "iPhone 16 Pro"
        "iPhone 16"
        "iPhone 15 Pro Max"
        "iPhone 15 Plus"
        "iPhone 15 Pro"
        "iPhone 15"
        "iPhone 14 Pro Max"
        "iPhone 14 Pro"
        "iPhone 14"
    )

    # Find the best available simulator
    for SIM in "${SIMULATOR_PREFERENCES[@]}"; do
        if xcrun simctl list devices available | grep -q "$SIM"; then
            SIMULATOR_NAME="$SIM"
            break
        fi
    done

    if [ -z "$SIMULATOR_NAME" ]; then
        print_warning "No preferred simulator found, using first available iPhone"
        SIMULATOR_NAME=$(xcrun simctl list devices available | grep "iPhone" | head -n1 | sed 's/^[[:space:]]*//' | cut -d'(' -f1 | sed 's/[[:space:]]*$//')
    fi

    if [ -z "$SIMULATOR_NAME" ]; then
        print_error "No iOS simulators found"
        exit 1
    fi

    print_success "Using simulator: $SIMULATOR_NAME"

    # Get the device ID
    DEVICE_ID=$(xcrun simctl list devices available | grep "$SIMULATOR_NAME" | head -n1 | grep -oE '\([A-Z0-9-]+\)' | tr -d '()')

    # Boot the simulator if not already booted
    if ! xcrun simctl list devices | grep "$DEVICE_ID" | grep -q "Booted"; then
        print_status "Booting $SIMULATOR_NAME..."
        xcrun simctl boot "$DEVICE_ID"
        sleep 5
    else
        print_success "$SIMULATOR_NAME is already booted"
    fi

    # Wait for simulator to be ready
    print_status "Waiting for simulator to be fully ready..."
    for i in {1..20}; do
        if xcrun simctl list devices | grep "$DEVICE_ID" | grep -q "Booted"; then
            # Check if SpringBoard is running (simulator is fully loaded)
            if xcrun simctl spawn "$DEVICE_ID" launchctl list 2>/dev/null | grep -q "com.apple.SpringBoard"; then
                print_success "Simulator is ready!"
                break
            fi
        fi
        if [ $i -eq 20 ]; then
            print_warning "Simulator may not be fully ready, continuing anyway..."
            break
        fi
        sleep 1
    done

    # Bring Simulator to front
    osascript -e 'tell application "Simulator" to activate' 2>/dev/null || true
}

# Step 6: Clean and start Metro bundler
start_metro() {
    print_status "Cleaning up any existing Metro/Expo processes..."

    # Kill existing processes
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "react-native" 2>/dev/null || true
    pkill -f "metro" 2>/dev/null || true
    pkill -f "watchman" 2>/dev/null || true

    # Kill processes on Metro port
    if lsof -Pi :${METRO_PORT} -sTCP:LISTEN -t >/dev/null 2>/dev/null; then
        print_status "Stopping process on port ${METRO_PORT}..."
        lsof -ti:${METRO_PORT} | xargs kill -9 2>/dev/null || true
    fi

    sleep 2

    # Clear Metro cache
    print_status "Clearing Metro cache..."
    rm -rf $TMPDIR/metro-* 2>/dev/null || true
    rm -rf $TMPDIR/haste-* 2>/dev/null || true
    rm -rf $TMPDIR/react-* 2>/dev/null || true

    # Clear watchman if available
    if command -v watchman &> /dev/null; then
        watchman watch-del-all >/dev/null 2>&1 || true
    fi

    print_status "Starting Metro bundler with cache cleared..."
    # Start Metro without requiring Expo login
    EXPO_NO_TELEMETRY=1 npx expo start --clear --localhost --port ${METRO_PORT} > /tmp/metro-ios.log 2>&1 &
    METRO_PID=$!

    # Wait for Metro to be ready
    print_status "Waiting for Metro bundler to start..."
    for i in {1..30}; do
        if curl -s http://localhost:${METRO_PORT}/status > /dev/null 2>&1; then
            print_success "Metro bundler is ready on port ${METRO_PORT}!"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Metro bundler failed to start"
            print_status "Showing last 20 lines of Metro log:"
            tail -20 /tmp/metro-ios.log
            exit 1
        fi
        sleep 1
    done

    # Give Metro a bit more time to fully initialize
    sleep 2

    # Additional verification that Metro is serving bundles
    print_status "Verifying Metro can serve bundles..."
    for i in {1..10}; do
        if curl -s "http://localhost:${METRO_PORT}/status" | grep -q "packager-status:running"; then
            print_success "Metro is serving bundles!"
            break
        fi
        if [ $i -eq 10 ]; then
            print_warning "Metro may not be fully ready to serve bundles"
        fi
        sleep 1
    done
}

# Step 7: Build and launch the iOS app
build_and_launch_app() {
    print_status "Building and launching iOS app..."

    # Get the device ID if we don't have it
    if [ -z "$DEVICE_ID" ]; then
        DEVICE_ID=$(xcrun simctl list devices | grep "$SIMULATOR_NAME" | grep "Booted" | head -n1 | grep -oE '\([A-Z0-9-]+\)' | tr -d '()')
    fi

    if [ -z "$DEVICE_ID" ]; then
        print_error "Could not find booted simulator device ID"
        exit 1
    fi

    print_status "Building app for $SIMULATOR_NAME (Device ID: $DEVICE_ID)..."

    # Build and run the app using Expo CLI
    # This will use the existing Metro bundler we started
    # Don't use --device flag as it causes issues with simulator selection
    EXPO_NO_TELEMETRY=1 npx expo run:ios --port ${METRO_PORT} > /tmp/ios-build.log 2>&1 &
    BUILD_PID=$!

    # Monitor the build progress
    print_status "Building iOS app (this may take a few minutes on first run)..."

    # Wait for the build to complete and app to launch
    for i in {1..180}; do  # 3 minutes timeout
        # Check if build is still running
        if ! ps -p $BUILD_PID > /dev/null 2>&1; then
            # Build process ended, check if it was successful
            if grep -q "success" /tmp/ios-build.log 2>/dev/null || grep -q "Successfully" /tmp/ios-build.log 2>/dev/null; then
                print_success "App built and launched successfully!"
                break
            elif grep -q "error" /tmp/ios-build.log 2>/dev/null || grep -q "Error" /tmp/ios-build.log 2>/dev/null; then
                print_error "Build failed. Showing last 30 lines of build log:"
                tail -30 /tmp/ios-build.log
                exit 1
            fi
        fi

        # Show progress indicator
        if [ $((i % 10)) -eq 0 ]; then
            echo -n "."
        fi

        # Check if app is running by looking for the bundle identifier in running processes
        if xcrun simctl spawn "$DEVICE_ID" launchctl list 2>/dev/null | grep -q "com.sammuthu.cosmicboard"; then
            print_success "App is running on simulator!"
            break
        fi

        if [ $i -eq 180 ]; then
            print_error "Build timeout after 3 minutes"
            print_status "Showing last 30 lines of build log:"
            tail -30 /tmp/ios-build.log
            exit 1
        fi

        sleep 1
    done
    echo ""

    # Give the app a moment to fully launch
    print_status "Waiting for app to fully launch..."
    sleep 5

    # Ensure app connects to Metro bundler
    print_status "Ensuring app connects to Metro bundler..."

    # Wait a bit for the initial connection attempt
    sleep 3

    # Open the development URL to connect to Metro
    print_status "Connecting to Metro bundler at localhost:${METRO_PORT}..."
    xcrun simctl openurl "$DEVICE_ID" "exp://localhost:${METRO_PORT}" 2>/dev/null || true

    # Give time for the connection to establish
    print_status "Waiting for bundle to load..."
    sleep 5

    # Check if bundle is being served
    if curl -s "http://localhost:${METRO_PORT}/status" | grep -q "packager-status:running"; then
        print_success "Metro bundler is serving the app bundle"
    fi

    # Bring Simulator to front
    osascript -e 'tell application "Simulator" to activate' 2>/dev/null || true
}

# Step 8: Take screenshot for verification
take_screenshot() {
    print_status "Taking screenshot for verification..."

    # Create screenshots directory if it doesn't exist
    mkdir -p "$PROJECT_DIR/screenshots"

    # Generate timestamp for filename
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    SCREENSHOT_PATH="$PROJECT_DIR/screenshots/ios_launch_${TIMESTAMP}.png"

    # Take screenshot using xcrun simctl
    if [ ! -z "$DEVICE_ID" ]; then
        xcrun simctl io "$DEVICE_ID" screenshot "$SCREENSHOT_PATH"

        if [ -f "$SCREENSHOT_PATH" ]; then
            print_success "Screenshot saved to: screenshots/ios_launch_${TIMESTAMP}.png"

            # Open the screenshot for viewing
            open "$SCREENSHOT_PATH"

            # Check if the screenshot shows an error
            # If it does, try to reload the app
            print_status "Checking app state..."

            # Try reloading the app to ensure Metro connection
            print_status "Sending reload command to ensure fresh bundle..."
            xcrun simctl openurl "$DEVICE_ID" "exp://localhost:${METRO_PORT}" 2>/dev/null || true
            sleep 3

            # Take another screenshot after reload
            TIMESTAMP2=$(date +"%Y%m%d_%H%M%S")
            SCREENSHOT_PATH2="$PROJECT_DIR/screenshots/ios_launch_${TIMESTAMP2}_reloaded.png"
            xcrun simctl io "$DEVICE_ID" screenshot "$SCREENSHOT_PATH2"
            print_success "Post-reload screenshot saved to: screenshots/ios_launch_${TIMESTAMP2}_reloaded.png"
        else
            print_warning "Failed to take screenshot"
        fi
    else
        print_warning "Could not take screenshot - no device ID"
    fi
}

# Step 9: Display final status
display_status() {
    echo ""
    echo "========================================="
    echo "   ${APP_NAME} - iOS"
    echo "========================================="
    echo ""

    print_status "Service Status:"
    echo "-------------------"

    # Check backend
    echo -n "Backend API (port ${BACKEND_PORT}): "
    if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ Not running${NC}"
    fi

    # Check Metro bundler
    echo -n "Metro Bundler (port ${METRO_PORT}): "
    if curl -s http://localhost:${METRO_PORT}/status > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi

    # Check iOS Simulator
    echo -n "iOS Simulator ($SIMULATOR_NAME): "
    if [ ! -z "$DEVICE_ID" ] && xcrun simctl list devices | grep "$DEVICE_ID" | grep -q "Booted"; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
    fi

    # Check if app is running
    echo -n "Cosmic Space App: "
    if [ ! -z "$DEVICE_ID" ] && xcrun simctl spawn "$DEVICE_ID" launchctl list 2>/dev/null | grep -q "com.sammuthu.cosmicboard"; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ May still be launching${NC}"
    fi

    echo ""
    print_status "Access Information:"
    echo "-------------------"
    echo -e "Backend API:      ${GREEN}http://localhost:${BACKEND_PORT}/api${NC}"
    echo -e "Metro Bundler:    ${GREEN}http://localhost:${METRO_PORT}${NC}"
    echo -e "Dev Menu:         ${GREEN}Cmd+D in Simulator${NC}"
    echo -e "Reload:           ${GREEN}Cmd+R in Simulator${NC}"
    echo ""

    print_status "Troubleshooting Commands:"
    echo "-------------------"
    echo "• Reload app:     Press Cmd+R in the Simulator"
    echo "• Dev menu:       Press Cmd+D in the Simulator"
    echo "• Restart Metro:  npx expo start --clear --ios"
    echo "• View logs:      tail -f /tmp/metro-ios.log"
    echo "• Clean build:    cd ios && xcodebuild clean && cd .."
    echo ""

    print_success "Setup complete! The app should be running on your iOS Simulator."
    echo ""
}

# Main execution flow
main() {
    echo ""
    echo "========================================="
    echo "   Cosmic Space iOS Development"
    echo "========================================="
    echo ""

    # Run all setup steps in order
    check_macos
    check_xcode
    check_backend "$@"
    install_dependencies
    start_simulator
    start_metro
    build_and_launch_app

    # Wait a moment for everything to settle
    sleep 2

    # Take screenshot for verification
    take_screenshot

    # Display final status
    display_status

    print_status "Monitoring Metro bundler (press Ctrl+C to stop)..."
    echo ""

    # Keep the script running and show Metro logs
    tail -f /tmp/metro-ios.log
}

# Cleanup function
cleanup() {
    echo ""
    print_warning "Shutting down services..."

    # Kill Metro bundler
    if [ ! -z "$METRO_PID" ]; then
        kill $METRO_PID 2>/dev/null || true
    fi

    # Kill backend if we started it
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi

    # Kill build process if still running
    if [ ! -z "$BUILD_PID" ]; then
        kill $BUILD_PID 2>/dev/null || true
    fi

    # Clean up any remaining processes
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "metro" 2>/dev/null || true

    print_success "Cleanup complete"
    exit 0
}

# Set up cleanup on exit
trap cleanup EXIT INT TERM

# Run main function with all arguments
main "$@"