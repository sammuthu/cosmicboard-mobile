#!/bin/bash

# CosmicBoard Android Development Setup Script - INTERACTIVE VERSION
# This script handles Android emulator setup and app launching
# Keeps the terminal alive and shows Metro logs

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="CosmicBoard Mobile"
BACKEND_PORT=7779
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

        # Check if backend directory exists
        if [ ! -d "../cosmicboard-backend" ]; then
            print_warning "Backend directory not found at ../cosmicboard-backend"
            print_status "Backend must be running separately. Please start it manually."
            return
        fi

        if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
            print_success "Backend server is running on port ${BACKEND_PORT}"
        else
            print_warning "Backend server not running. Starting backend..."

            # Check PostgreSQL first
            if docker ps 2>/dev/null | grep -q "cosmicboard_postgres"; then
                print_success "PostgreSQL is running"
            else
                print_status "Starting PostgreSQL..."
                if [ -f "../cosmicboard-backend/docker-compose.yml" ]; then
                    (cd ../cosmicboard-backend && docker compose up -d) || true
                    sleep 5
                else
                    print_warning "docker-compose.yml not found, skipping PostgreSQL start"
                fi
            fi

            # Install backend dependencies if needed
            if [ ! -d "../cosmicboard-backend/node_modules" ]; then
                print_status "Installing backend dependencies..."
                (cd ../cosmicboard-backend && npm install) || true
            fi

            # Kill any existing backend process on the port
            if lsof -Pi :${BACKEND_PORT} -sTCP:LISTEN -t >/dev/null 2>/dev/null; then
                print_status "Killing existing process on port ${BACKEND_PORT}..."
                lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true
                sleep 2
            fi

            # Start backend server with nohup to keep it running
            print_status "Starting backend server..."
            (cd ../cosmicboard-backend && nohup npm run dev > /tmp/backend.log 2>&1 &)
            # Don't track PID since we want it to keep running

            # Wait for backend to be ready
            print_status "Waiting for backend to be ready..."
            for i in {1..60}; do
                if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
                    print_success "Backend is ready!"
                    break
                fi
                if [ $i -eq 60 ]; then
                    print_error "Backend failed to start. Check /tmp/backend.log for details"
                    tail -20 /tmp/backend.log
                    print_warning "Continuing anyway, but app may not work properly"
                fi
                echo -n "."
                sleep 2
            done
            echo ""
        fi
    fi
}

# Step 6: Install app dependencies and check API configuration
install_dependencies() {
    print_status "Checking dependencies..."

    # Always ensure all dependencies are installed
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/expo-document-picker" ]; then
        print_status "Installing dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        # Quick check for missing packages
        if ! npm ls expo-document-picker >/dev/null 2>&1; then
            print_warning "Some dependencies missing. Reinstalling..."
            npm install
        fi
        print_success "Dependencies verified"
    fi

    # Clear Metro cache to avoid module resolution issues
    print_status "Clearing Metro cache..."
    npx expo start --clear --reset-cache >/dev/null 2>&1 &
    TEMP_PID=$!
    sleep 3
    kill $TEMP_PID 2>/dev/null || true

    # Clear watchman if available
    if command -v watchman &> /dev/null; then
        watchman watch-del-all >/dev/null 2>&1 || true
    fi

    # Clear temp directories
    rm -rf $TMPDIR/metro-* 2>/dev/null || true
    rm -rf $TMPDIR/haste-* 2>/dev/null || true
    
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

    print_status "Starting Metro bundler (interactive mode)..."
    # For interactive mode, we'll run Metro in foreground later
    # For now, start it in background to complete setup
    npx expo start --clear --reset-cache --port ${METRO_PORT} > /tmp/metro-android.log 2>&1 &
    METRO_PID=$!

    # Wait for Metro to be ready with increased timeout
    print_status "Waiting for Metro bundler to start (this may take a minute)..."
    for i in {1..60}; do
        if curl -s http://localhost:${METRO_PORT}/status > /dev/null 2>&1; then
            print_success "Metro bundler is ready!"
            break
        fi
        if [ $i -eq 60 ]; then
            print_error "Metro bundler failed to start"
            tail -20 /tmp/metro-android.log
            exit 1
        fi
        if [ $((i % 10)) -eq 0 ]; then
            echo -n "."
        fi
        sleep 1
    done
    echo ""
}

# Step 8: Configure Android device for backend access
configure_device() {
    print_status "Configuring Android device for backend access..."

    # Ensure adb reverse is properly set up (sometimes it gets lost)
    adb reverse --remove-all 2>/dev/null || true
    sleep 1

    # Set up reverse port forwarding for backend
    adb reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT} 2>/dev/null || true

    # Set up reverse port forwarding for Metro
    adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT} 2>/dev/null || true

    # Set up reverse port forwarding for Dev server
    adb reverse tcp:8082 tcp:8082 2>/dev/null || true

    # Verify port forwarding
    if adb reverse --list | grep -q "${METRO_PORT}"; then
        print_success "Port forwarding verified"
    else
        print_warning "Port forwarding may not be working properly"
        adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT} 2>/dev/null || true
    fi

    print_success "Device configured for local development"
}

# Step 9: Build and launch the app
build_and_launch_app() {
    print_status "Checking if app needs to be rebuilt..."

    # Check if the app is already installed
    if adb shell pm list packages 2>/dev/null | grep -q "com.sammuthu.cosmicboard"; then
        print_status "App already installed. Launching..."

        # Force stop any existing instance
        adb shell am force-stop com.sammuthu.cosmicboard 2>/dev/null || true
        sleep 2

        # Launch the app fresh
        adb shell am start -n com.sammuthu.cosmicboard/.MainActivity 2>/dev/null || true

        # Wait for app to initialize
        print_status "Waiting for app to initialize..."
        sleep 8

        # Check if app is responsive
        if adb shell dumpsys window | grep -q "mCurrentFocus.*com.sammuthu.cosmicboard"; then
            print_success "App launched successfully!"

            # Give extra time for bundle to load
            sleep 5

            # Verify the app loaded properly by checking for ReactNative logs
            if adb logcat -d -t 100 | grep -q "ReactNativeJS"; then
                print_success "App is running with React Native!"
            else
                print_warning "App may need a reload. Attempting automatic reload..."
                # Try to reload programmatically
                adb shell am broadcast -a com.facebook.react.devsupport.RELOAD 2>/dev/null || true
                sleep 3
            fi
        else
            print_warning "App may not be focused. Trying to bring to foreground..."
            adb shell monkey -p com.sammuthu.cosmicboard -c android.intent.category.LAUNCHER 1 2>/dev/null || true
        fi
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
    start_metro

    # Configure device AFTER Metro is running
    # This ensures ports are ready to be forwarded
    sleep 3
    configure_device
    
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

    # Final verification with extended checks
    echo ""
    print_status "Performing final verification..."
    sleep 5  # Give more time for services to stabilize

    # Detailed service check
    local all_good=true
    echo ""
    print_status "Verifying all services..."
    echo "-----------------------------------"

    # 1. Check Backend API
    echo -n "Backend API (${BACKEND_PORT}): "
    if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not accessible${NC}"
        all_good=false
    fi

    # 2. Check Metro Bundler
    echo -n "Metro Bundler (${METRO_PORT}): "
    if curl -s http://localhost:${METRO_PORT}/status > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${RED}✗ Not running${NC}"
        all_good=false
    fi

    # 3. Check ALL port forwarding
    echo -n "Port Forwarding: "
    local ports_ok=true

    # Check backend port
    if ! adb reverse --list | grep -q "tcp:${BACKEND_PORT}"; then
        ports_ok=false
        print_warning "Backend port ${BACKEND_PORT} not forwarded!"
        adb reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT} 2>/dev/null || true
    fi

    # Check Metro port
    if ! adb reverse --list | grep -q "tcp:${METRO_PORT}"; then
        ports_ok=false
        print_warning "Metro port ${METRO_PORT} not forwarded!"
        adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT} 2>/dev/null || true
    fi

    # Check DevTools port
    if ! adb reverse --list | grep -q "tcp:8082"; then
        adb reverse tcp:8082 tcp:8082 2>/dev/null || true
    fi

    if [ "$ports_ok" = true ]; then
        echo -e "${GREEN}✓ All ports forwarded${NC}"
    else
        echo -e "${YELLOW}⚠ Fixed port forwarding${NC}"
        # Show current forwarding
        echo "Active port forwards:"
        adb reverse --list | sed 's/^/  /'
    fi

    # 4. Check app is running
    echo -n "App Status: "
    if adb shell dumpsys window | grep -q "mCurrentFocus.*com.sammuthu.cosmicboard"; then
        echo -e "${GREEN}✓ Running and focused${NC}"
    else
        echo -e "${YELLOW}⚠ May not be focused${NC}"
        all_good=false
    fi

    # 5. Test actual API connectivity from app perspective
    echo -n "API Connectivity: "
    # Wait a moment for any recent port forward changes to take effect
    sleep 2

    # Test if the app can reach the backend (check recent logs)
    if adb logcat -d -t 50 | grep -q "API Response: 200"; then
        echo -e "${GREEN}✓ App can reach API${NC}"
    else
        echo -e "${YELLOW}⚠ App may have connectivity issues${NC}"
        # Try one more time to ensure ports are forwarded
        adb reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT} 2>/dev/null || true
        adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT} 2>/dev/null || true
    fi

    echo "-----------------------------------"

    if [ "$all_good" = true ]; then
        echo ""
        print_success "🎉 Everything is working! Your app should be running."
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "  INTERACTIVE MODE - Metro Bundler Console"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        echo "Controls:"
        echo "• Press 'r' to reload the app"
        echo "• Press 'd' to open developer menu"
        echo "• Press Ctrl+C to stop all services and exit"
        echo ""
        echo "Services running:"
        echo "• Backend API on port ${BACKEND_PORT}"
        echo "• Metro bundler on port ${METRO_PORT}"
        echo "• Port forwarding is active"
        echo ""
        print_status "Switching to Metro console..."
        echo "-----------------------------------------------------------"
        echo ""

        # Kill the background Metro and restart in foreground for interactive mode
        if [ ! -z "$METRO_PID" ]; then
            kill $METRO_PID 2>/dev/null || true
            sleep 2
        fi

        # Run Metro in foreground - this will keep the terminal alive
        print_success "Metro bundler running interactively. Press 'r' to reload."
        npx expo start --clear --reset-cache --port ${METRO_PORT}
    else
        echo ""
        print_warning "Some components may need attention."
        echo "If the app isn't loading or has network errors:"
        echo "1. Run: ./fix-android-dev.sh"
        echo "2. Or press Cmd+M and select 'Reload'"
        echo ""
        print_status "Attempting automatic recovery..."
        # Final attempt to fix connectivity
        adb reverse tcp:${BACKEND_PORT} tcp:${BACKEND_PORT} 2>/dev/null || true
        adb reverse tcp:${METRO_PORT} tcp:${METRO_PORT} 2>/dev/null || true
        adb reverse tcp:8082 tcp:8082 2>/dev/null || true
        sleep 2
        print_success "Port forwarding re-established. App should work now."

        echo ""
        print_status "Starting interactive mode anyway..."
        echo "-----------------------------------------------------------"

        # Kill the background Metro and restart in foreground
        if [ ! -z "$METRO_PID" ]; then
            kill $METRO_PID 2>/dev/null || true
            sleep 2
        fi

        # Run Metro in foreground even if there were issues
        npx expo start --clear --reset-cache --port ${METRO_PORT}
    fi
}

# Cleanup function for interactive mode - cleans up everything on exit
cleanup() {
    echo ""
    echo ""
    print_warning "Shutting down interactive session..."

    # Kill Metro if running
    print_status "Stopping Metro bundler..."
    pkill -f "expo start" 2>/dev/null || true

    # Ask if user wants to stop backend
    echo ""
    echo -n "Stop backend server too? (y/N): "
    read -t 5 -n 1 stop_backend || true
    echo ""

    if [[ "$stop_backend" == "y" || "$stop_backend" == "Y" ]]; then
        print_status "Stopping backend server..."
        pkill -f "cosmicboard-backend" 2>/dev/null || true
    else
        print_status "Backend server kept running"
    fi

    # Ask about port forwarding
    echo -n "Remove port forwarding? (y/N): "
    read -t 5 -n 1 remove_ports || true
    echo ""

    if [[ "$remove_ports" == "y" || "$remove_ports" == "Y" ]]; then
        print_status "Removing port forwarding..."
        adb reverse --remove-all 2>/dev/null || true
    else
        print_status "Port forwarding kept active"
        echo "Active port forwards:"
        adb reverse --list 2>/dev/null | sed 's/^/  /' || true
    fi

    echo ""
    print_success "Interactive session ended"
    echo ""
    echo "To restart: ./start-android-interactive.sh"
    echo "To run in background: ./start-android.sh"
    exit 0
}

# Only trap on interrupt (Ctrl+C), not on normal exit
trap cleanup INT TERM

# Run main function
main "$@"