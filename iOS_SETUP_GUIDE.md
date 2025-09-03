# iOS Development Setup Guide for CosmicBoard Mobile

## Prerequisites Setup

### 1. Configure Xcode (One-time setup)
```bash
# Set Xcode as active developer directory
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
sudo xcodebuild -license accept

# Install iOS simulators (if needed)
xcodebuild -downloadPlatform iOS
```

### 2. Check CocoaPods Installation
```bash
# Install CocoaPods if not already installed
sudo gem install cocoapods

# Or with Homebrew
brew install cocoapods
```

## Setting Up iOS Project with Expo

### Step 1: Generate Native iOS Project
```bash
# In your project directory
npx expo prebuild --platform ios

# This creates an 'ios' folder with the native project
```

### Step 2: Install iOS Dependencies
```bash
cd ios
pod install
cd ..
```

## Running on iOS Simulator

### Method 1: Using Expo (Recommended for Development)
```bash
# Start the Expo development server
npx expo start

# Press 'i' to open iOS simulator
# Or run directly:
npx expo run:ios
```

### Method 2: Using Xcode
1. Open `ios/cosmicboardmobile.xcworkspace` in Xcode
2. Select a simulator from the device menu
3. Press Cmd+R to build and run

### Available Simulators
```bash
# List all available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 16 Pro Max"

# Open Simulator app
open -a Simulator
```

## Testing on Real Devices (iPhone 16 Pro Max & iPad)

### Step 1: Apple Developer Account Configuration
1. Open Xcode
2. Go to Xcode → Settings → Accounts
3. Add your Apple ID associated with your developer account
4. Download certificates

### Step 2: Configure App Signing
1. Open `ios/cosmicboardmobile.xcworkspace` in Xcode
2. Select your project in the navigator
3. Go to "Signing & Capabilities" tab
4. Enable "Automatically manage signing"
5. Select your Team (your developer account)
6. Update Bundle Identifier to something unique:
   - Format: `com.yourname.cosmicboard`
   - Example: `com.sammuthu.cosmicboard`

### Step 3: Prepare Your Device
1. Connect your iPhone/iPad via USB
2. On the device: Settings → Privacy & Security → Developer Mode → Enable
3. Trust your computer when prompted
4. Trust your developer certificate:
   - Settings → General → VPN & Device Management
   - Select your Developer App certificate
   - Tap "Trust"

### Step 4: Build and Run on Device

#### Using Expo (Easier)
```bash
# With device connected
npx expo run:ios --device

# Or use Expo Go app (for development)
# 1. Install Expo Go from App Store on your device
# 2. Run: npx expo start
# 3. Scan QR code with Expo Go app
```

#### Using Xcode (More Control)
1. Select your device from the device menu in Xcode
2. Press Cmd+R to build and run
3. First time will ask to trust the developer on the device

## App Configuration for Production

### Update app.json for iOS
```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sammuthu.cosmicboard",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan QR codes",
        "NSPhotoLibraryUsageDescription": "This app needs access to photo library"
      }
    }
  }
}
```

### Create App Icons and Splash Screens
```bash
# Generate app icons (1024x1024 PNG)
# Place in assets/icon.png

# Generate splash screen (2048x2048 PNG)
# Place in assets/splash.png

# Expo will automatically generate all required sizes
```

## Building for TestFlight/App Store

### Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Local Build with Xcode
1. In Xcode: Product → Archive
2. Once archived: Window → Organizer
3. Select archive and click "Distribute App"
4. Choose "App Store Connect" for TestFlight/App Store

## Troubleshooting Common Issues

### Issue: "Unable to run simctl"
```bash
# Reset simulators
xcrun simctl shutdown all
xcrun simctl erase all
```

### Issue: "No bundle URL present"
```bash
# Clear Metro bundler cache
npx expo start -c
```

### Issue: "Could not find a developer disk image"
- Update Xcode to support your iOS version
- Or download the disk image for your iOS version

### Issue: Build fails with signing errors
1. Revoke certificates in Apple Developer portal
2. In Xcode: Preferences → Accounts → Download Manual Profiles
3. Clean build: Cmd+Shift+K
4. Try building again

## Testing Different Screen Sizes

### In Simulator
- iPhone SE (3rd gen) - Smallest current iPhone
- iPhone 16 Pro Max - Largest iPhone
- iPad Pro 12.9" - Largest iPad
- iPad mini - Smallest iPad

### Responsive Design Testing
```bash
# Run on specific simulator
npx expo run:ios --simulator="iPhone SE (3rd generation)"
npx expo run:ios --simulator="iPhone 16 Pro Max"
npx expo run:ios --simulator="iPad Pro (12.9-inch)"
```

## Next Steps

1. Test AsyncStorage data persistence
2. Implement cloud sync with MongoDB
3. Add push notifications
4. Configure deep linking
5. Set up crash reporting (Sentry/Crashlytics)

## Useful Commands Reference

```bash
# Start development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on connected device
npx expo run:ios --device

# Clear cache and restart
npx expo start -c

# Check Expo Doctor
npx expo doctor

# Update Expo SDK
npx expo upgrade
```

## Resources
- [Expo iOS Development](https://docs.expo.dev/workflow/ios-development/)
- [Apple Developer Portal](https://developer.apple.com)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)