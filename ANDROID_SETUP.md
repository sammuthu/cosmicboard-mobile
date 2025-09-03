# Android Setup Instructions for CosmicBoard Mobile

Android Studio has been successfully installed. To complete the setup and run the Android version:

## 1. First-Time Android Studio Setup

1. **Open Android Studio** from Applications folder
2. Go through the initial setup wizard:
   - Select "Standard" installation
   - Accept all licenses
   - Let it download the Android SDK components

## 2. Install Required SDK Components

Once Android Studio opens:
1. Click on **"More Actions"** → **"SDK Manager"** (or Tools → SDK Manager if you have a project open)
2. In the **SDK Platforms** tab, ensure these are checked:
   - Android 14.0 (API 34) 
   - Android 13.0 (API 33)
3. In the **SDK Tools** tab, ensure these are checked:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
   - Intel x86 Emulator Accelerator (HAXM) - for Intel Macs
4. Click "Apply" and let it download/install

## 3. Create an Android Virtual Device (AVD)

1. In Android Studio, click **"More Actions"** → **"Virtual Device Manager"**
2. Click **"Create Virtual Device"**
3. Select a device (e.g., Pixel 8 Pro)
4. Select a system image (API 34 recommended)
5. Name your AVD and click "Finish"

## 4. Set Environment Variables

Add these to your `~/.zshrc` or `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload your shell:
```bash
source ~/.zshrc
```

## 5. Run CosmicBoard on Android

### Option A: Using the start-android.sh script
```bash
./start-android.sh
```

### Option B: Manual Steps
```bash
# 1. Start the Android emulator
emulator -avd <your_avd_name> &

# 2. Wait for it to boot, then run:
npx expo run:android
```

### Option C: Using Expo Go App (Easiest for Development)
1. Start the emulator from Android Studio
2. Open Google Play Store in the emulator
3. Search for and install "Expo Go"
4. Run `npx expo start` in your project
5. Press 'a' in the terminal to open in Android emulator

## Troubleshooting

### If emulator won't start:
- Ensure virtualization is enabled in your Mac's settings
- Try creating a new AVD with lower API level (e.g., API 33)
- Check available AVDs: `emulator -list-avds`

### If build fails:
- Clear cache: `npx expo start --clear`
- Clean Android build: `cd android && ./gradlew clean` (if android folder exists)

### Port forwarding for backend:
The app will try to connect to your backend at localhost:7778. If it can't connect:
```bash
adb reverse tcp:7778 tcp:7778
```

## Current Status
✅ Android Studio installed
✅ Android command-line tools installed
✅ Java installed (OpenJDK 23)
⏳ Waiting for SDK components installation through Android Studio
⏳ Waiting for AVD creation

Once you complete steps 1-4 above, you'll be able to run the Android version of CosmicBoard!