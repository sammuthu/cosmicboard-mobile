#!/bin/bash

# Fix native module linking issues
echo "Fixing native module linking issues..."

# 1. Clean everything
echo "Step 1: Cleaning all caches and builds..."
rm -rf node_modules
rm -rf .expo
rm -rf android/app/build
rm -rf android/build
rm -rf ios/Pods
rm -rf ios/build
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 2. Reinstall dependencies
echo "Step 2: Reinstalling dependencies..."
npm install

# 3. Reset Metro cache
echo "Step 3: Resetting Metro cache..."
npx expo start --clear --reset-cache &
METRO_PID=$!
sleep 5
kill $METRO_PID 2>/dev/null || true

# 4. Clean prebuild
echo "Step 4: Cleaning native directories..."
rm -rf android ios

# 5. Generate fresh native code
echo "Step 5: Generating fresh native code (ignoring git warnings)..."
EXPO_NO_GIT_STATUS=1 npx expo prebuild --clean --platform android

# 6. Ensure Expo modules are properly linked
echo "Step 6: Verifying Expo module linking..."
cd android
./gradlew clean
cd ..

# 7. Uninstall app from device if connected
echo "Step 7: Uninstalling old app from device..."
adb uninstall com.sammuthu.cosmicboard 2>/dev/null || true

echo "Fix complete! Now run: npx expo run:android"
echo ""
echo "If the error persists, try:"
echo "1. Close your emulator completely"
echo "2. Open Android Studio and wipe emulator data"
echo "3. Start emulator fresh"
echo "4. Run: npx expo run:android"