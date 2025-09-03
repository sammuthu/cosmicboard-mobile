# Android Development Setup Guide for CosmicBoard Mobile

## Prerequisites

### 1. Install Java Development Kit (JDK)
```bash
# Check if Java is installed
java -version

# Install OpenJDK 17 (recommended for React Native)
brew install openjdk@17

# Set JAVA_HOME
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

### 2. Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and go through initial setup
4. Install Android SDK (will be prompted during setup)

### 3. Configure Environment Variables
```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Reload shell configuration
source ~/.zshrc
```

### 4. Install Android SDK Components
Open Android Studio → Settings → SDK Manager
Install:
- Android SDK Platform 34 (or latest)
- Intel x86 Atom_64 System Image (for emulator)
- Google APIs Intel x86 Atom System Image
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android Emulator

## Setting Up Android Project with Expo

### Step 1: Generate Native Android Project
```bash
# In your project directory
npx expo prebuild --platform android

# This creates an 'android' folder with the native project
```

### Step 2: Verify Setup
```bash
# Check if everything is configured correctly
npx expo doctor

# Run Android diagnostics
npx react-native doctor
```

## Running on Android Emulator

### Method 1: Using Expo (Recommended)
```bash
# Start the Expo development server
npx expo start

# Press 'a' to open Android emulator
# Or run directly:
npx expo run:android
```

### Method 2: Manual Emulator Setup
```bash
# List available Android Virtual Devices (AVDs)
emulator -list-avds

# Create a new AVD (if needed)
# Open Android Studio → AVD Manager → Create Virtual Device

# Start specific emulator
emulator -avd Pixel_8_Pro_API_34

# Or start from Android Studio
# Tools → AVD Manager → Launch
```

## Testing on Real Android Devices

### Step 1: Enable Developer Mode
1. Go to Settings → About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings → Developer Options
4. Enable "USB Debugging"
5. Enable "Install via USB"

### Step 2: Connect Device
```bash
# Connect device via USB
# Check if device is recognized
adb devices

# Should see something like:
# List of devices attached
# ABC123456789    device
```

### Step 3: Run on Device
```bash
# Using Expo
npx expo run:android --device

# Or with Expo development client
npx expo start
# Press 'a' when device is connected

# Using React Native directly
npx react-native run-android
```

## App Configuration for Android

### Update app.json for Android
```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a0f1b"
      },
      "package": "com.sammuthu.cosmicboard",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### Configure Build Settings (android/app/build.gradle)
```gradle
android {
    defaultConfig {
        applicationId "com.sammuthu.cosmicboard"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Building for Google Play Store

### Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android

# For Google Play Store (AAB format)
eas build --platform android --profile production
```

### Local Build
```bash
# Navigate to android directory
cd android

# Build debug APK
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Build release APK
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Build AAB for Play Store
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Signing Your App

### Generate Signing Key
```bash
# Generate a keystore
keytool -genkeypair -v -storetype PKCS12 -keystore cosmicboard.keystore -alias cosmicboard -keyalg RSA -keysize 2048 -validity 10000

# Keep this file safe! You'll need it for all future updates
```

### Configure Signing (android/app/build.gradle)
```gradle
android {
    signingConfigs {
        release {
            storeFile file('cosmicboard.keystore')
            storePassword 'your-password'
            keyAlias 'cosmicboard'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## Testing Different Android Versions & Devices

### Recommended Test Devices
- Pixel 8 Pro (Latest flagship)
- Samsung Galaxy S24
- OnePlus 12
- Pixel 4a (Budget device)
- Tablet: Samsung Galaxy Tab S9

### Create Multiple AVDs
```bash
# In Android Studio → AVD Manager
# Create AVDs with different:
# - API Levels (21, 28, 30, 34)
# - Screen sizes (Phone, Tablet, Foldable)
# - Hardware profiles
```

## Performance Optimization

### Enable Hermes (JavaScript Engine)
```javascript
// In app.json
{
  "expo": {
    "android": {
      "jsEngine": "hermes"
    }
  }
}
```

### ProGuard Rules (android/app/proguard-rules.pro)
```pro
# Add project specific ProGuard rules
-keep class com.sammuthu.cosmicboard.** { *; }
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
```

## Troubleshooting Common Issues

### Issue: "SDK location not found"
```bash
# Create local.properties in android folder
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### Issue: "Could not connect to development server"
```bash
# For physical devices, ensure they're on same network
# Or use reverse proxy
adb reverse tcp:8081 tcp:8081
```

### Issue: Build fails with Java version
```bash
# Ensure Java 17 is being used
java -version
javac -version

# Set correct Java version
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

### Issue: Gradle build fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug

# Clear Gradle cache
rm -rf ~/.gradle/caches/
```

## Useful ADB Commands

```bash
# List connected devices
adb devices

# Install APK
adb install app-debug.apk

# Uninstall app
adb uninstall com.sammuthu.cosmicboard

# View logs
adb logcat

# Clear app data
adb shell pm clear com.sammuthu.cosmicboard

# Take screenshot
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record video
adb shell screenrecord /sdcard/demo.mp4
# Press Ctrl+C to stop
adb pull /sdcard/demo.mp4
```

## Next Steps

1. Test on multiple Android versions
2. Implement Material Design components
3. Add Android-specific features (widgets, shortcuts)
4. Set up Firebase for analytics and crash reporting
5. Optimize for different screen densities

## Resources
- [Expo Android Development](https://docs.expo.dev/workflow/android-development/)
- [Android Developer Documentation](https://developer.android.com)
- [Google Play Console](https://play.google.com/console)
- [Material Design Guidelines](https://material.io/design)