#!/bin/bash

echo "Fixing CosmicBoard Android App..."

# Kill all Metro processes
echo "Killing Metro processes..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true

# Clean caches
echo "Cleaning caches..."
rm -rf .expo
rm -rf node_modules/.cache
cd android && ./gradlew clean && cd ..

# Wait for emulator
echo "Waiting for Android emulator..."
while ! adb devices | grep -q "device$"; do
    echo "No emulator found. Please start your Android emulator..."
    sleep 3
done

echo "Emulator found!"

# Uninstall old app
echo "Uninstalling old app..."
adb uninstall com.sammuthu.cosmicboard 2>/dev/null || true

# Run the app
echo "Building and running app..."
npx expo run:android

echo "Done! The app should be running now."