# CosmicBoard Mobile - Quick Start Guide

## Current Status
✅ **Web version running:** http://m.cosmic.board (port 8082)
✅ **Package compatibility fixed**
✅ **iOS/Android configuration completed**
✅ **Data sync architecture documented**

## Immediate Next Steps

### 1. Set Up Xcode (Required for iOS)
```bash
# Run this command to set Xcode as active
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Accept license
sudo xcodebuild -license accept
```

### 2. Test on iOS Simulator
```bash
# Start Expo with iOS simulator
npx expo start --ios

# Or specific simulator
npx expo run:ios --simulator="iPhone 16 Pro Max"
```

### 3. Test on Your iPhone 16 Pro Max
1. **Connect your iPhone via USB**
2. **Trust the computer on your phone**
3. **Enable Developer Mode:**
   - Settings → Privacy & Security → Developer Mode → ON
4. **Run on device:**
   ```bash
   npx expo run:ios --device
   ```

### 4. Quick Test with Expo Go (Easiest)
1. **Install "Expo Go" from App Store on your iPhone/iPad**
2. **Start development server:**
   ```bash
   npx expo start
   ```
3. **Scan the QR code with Expo Go app**

## Common Commands

```bash
# Web development
npx expo start --web --port 8082

# iOS development
npx expo start --ios           # Simulator
npx expo run:ios --device      # Real device

# Android development
npx expo start --android        # Emulator
npx expo run:android --device   # Real device

# Clear cache if issues
npx expo start -c
```

## File Structure
```
cosmicboard-mobile/
├── iOS_SETUP_GUIDE.md         # Complete iOS setup instructions
├── ANDROID_SETUP_GUIDE.md     # Complete Android setup instructions
├── DATA_SYNC_GUIDE.md         # MongoDB sync implementation
├── app.json                   # Configured for iOS/Android
├── src/
│   ├── components/            # UI components
│   ├── screens/              # App screens
│   ├── services/             # Storage & API services
│   └── navigation/           # Navigation setup
```

## Troubleshooting

### Blank Screen on Web
- Check browser console for errors
- Verify packages are compatible: `npx expo install --fix`
- Restart with cache clear: `npx expo start -c`

### iOS Simulator Issues
```bash
# Reset simulators
xcrun simctl shutdown all
xcrun simctl erase all
```

### Can't Run on Real Device
1. Ensure Developer Mode is enabled on device
2. Trust your developer certificate on device
3. Check cable connection
4. Verify device appears in: `xcrun devicectl list devices`

## What You Need to Do Now

1. **Set up Xcode** (follow iOS_SETUP_GUIDE.md)
2. **Test on iOS Simulator first**
3. **Then test on your iPhone 16 Pro Max**
4. **For production:** Set up EAS Build for TestFlight distribution

## Support Resources
- iOS Setup: See `iOS_SETUP_GUIDE.md`
- Android Setup: See `ANDROID_SETUP_GUIDE.md`
- Data Sync: See `DATA_SYNC_GUIDE.md`
- Expo Docs: https://docs.expo.dev