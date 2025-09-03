# Local Development Without Expo Account

You don't need an Expo account for local development and testing! Here's how to proceed:

## Option 1: Expo Development Build (Recommended for iOS)

This creates a custom development app that you can install directly on your devices without Expo Go.

### Step 1: Generate Native Projects
```bash
# This creates ios/ and android/ folders
npx expo prebuild
```

### Step 2: Run on iOS Simulator
```bash
# This builds and runs the app locally
npx expo run:ios

# Or specific simulator
npx expo run:ios --simulator="iPhone 16 Pro Max"
```

### Step 3: Run on Your iPhone/iPad
```bash
# With device connected via USB
npx expo run:ios --device

# Select your device from the list
```

## Option 2: Use React Native CLI Directly

Since Expo has created the native projects, you can use React Native CLI:

### For iOS:
```bash
# Install dependencies
cd ios && pod install && cd ..

# Run on simulator
npx react-native run-ios

# Run on device
npx react-native run-ios --device "Your iPhone Name"
```

### For Android:
```bash
# Run on emulator
npx react-native run-android

# Run on device
npx react-native run-android --deviceId=YOUR_DEVICE_ID
```

## Option 3: Build with Xcode (Full Control)

### Step 1: Open in Xcode
```bash
# Open the workspace (not the project)
open ios/cosmicboardmobile.xcworkspace
```

### Step 2: Configure Signing
1. Select your project in navigator
2. Go to "Signing & Capabilities"
3. Check "Automatically manage signing"
4. Select "Personal Team" (your Apple ID)

### Step 3: Build and Run
1. Select your device/simulator from the dropdown
2. Press Cmd+R or click the Play button

## Option 4: Local Web Development

Continue using the web version for rapid development:

```bash
# Run web version
npx expo start --web --port 8082

# Access at http://localhost:8082 or http://m.cosmic.board
```

## Running Without Login Prompts

Always use these flags to avoid login requirements:

```bash
# Start in offline mode
EXPO_OFFLINE=1 npx expo start --localhost

# Run iOS without account
npx expo run:ios --no-wait-for-bundler

# Run Android without account  
npx expo run:android --no-wait-for-bundler
```

## Development Workflow Without Account

### Daily Development:
1. **Make changes in your code**
2. **Test on web first** (fastest):
   ```bash
   npx expo start --web
   ```

3. **Test on iOS Simulator**:
   ```bash
   npx expo run:ios
   ```

4. **Test on real device** (periodically):
   ```bash
   npx expo run:ios --device
   ```

## Building for Distribution Without EAS

### For TestFlight (iOS):
1. Open Xcode
2. Product → Archive
3. Distribute App → App Store Connect

### For APK (Android):
```bash
cd android
./gradlew assembleRelease
# APK will be in android/app/build/outputs/apk/release/
```

## Advantages of No Account Development

✅ **No login required**
✅ **Full control over build process**
✅ **No usage limits**
✅ **Works completely offline**
✅ **Direct device installation**

## When You Might Want an Expo Account

- **EAS Build**: Cloud builds without local setup
- **EAS Update**: Over-the-air updates
- **Push Notifications**: Easier setup
- **Crash Reporting**: Integrated analytics

But for now, you can do everything locally!

## Quick Commands Reference

```bash
# Start development server (no login)
EXPO_OFFLINE=1 npx expo start --localhost

# iOS Simulator
npx expo run:ios

# Your iPhone
npx expo run:ios --device

# Android Emulator
npx expo run:android

# Web
npx expo start --web --port 8082

# Clear everything and restart
npx expo start -c
```

## Troubleshooting

### "Expo account required" error
- Use `EXPO_OFFLINE=1` flag
- Or use `npx expo run:ios` instead of `expo start`

### Can't find device
```bash
# List iOS devices
xcrun devicectl list devices

# List Android devices
adb devices
```

### Build fails
```bash
# Clean and rebuild
cd ios && rm -rf build && pod install && cd ..
npx expo run:ios --clear
```

You're all set for local development without any account!