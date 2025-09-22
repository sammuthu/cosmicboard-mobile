# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# iOS Development
./start.sh                      # Start iOS app with backend auto-start
./start.sh ios                  # iOS only (no web)
npm run ios                     # Run on iOS simulator

# Android Development
./start-android.sh              # Start Android app with emulator setup
npm run android                 # Run on Android emulator

# Metro/Expo
npx expo start --clear          # Start Metro bundler with cache clear
npx expo run:ios --port 8081   # Build iOS with specific Metro port
npx expo run:android           # Build Android

# Backend (assumes ../cosmicboard-backend exists)
cd ../cosmicboard-backend && npm run dev
```

### Troubleshooting
```bash
# Android port forwarding fix
adb reverse tcp:7779 tcp:7779

# Clean Metro/Expo processes
pkill -f "expo|metro|node"
lsof -ti:8081 | xargs kill -9

# iOS pod reinstall
cd ios && pod install && cd ..

# Android clean build
cd android && ./gradlew clean && cd ..
```

## Architecture

### Tech Stack
- **Frontend**: React Native with Expo SDK 53
- **Navigation**: React Navigation v7 (bottom tabs + stack)
- **State**: React Context API (Auth, Theme)
- **API**: Axios with interceptors for auth
- **Storage**: AsyncStorage, MMKV for performance-critical data
- **Backend**: PostgreSQL on port 7779 (expected at ../cosmicboard-backend)

### Project Structure
```
src/
├── contexts/           # Global state management
│   ├── AuthContext    # Auth state, token management, axios interceptors
│   └── ThemeContext   # Theme state, 8 database-driven themes
├── services/
│   ├── api.ts         # API service, localhost:7779 for dev
│   └── storage.ts     # AsyncStorage abstraction
├── navigation/
│   └── AppNavigator   # Tab navigator with 5 main screens
├── screens/           # Main app screens
└── components/        # Reusable UI components
```

### Key Implementation Details

**Authentication Flow**:
- Development uses hardcoded token in AuthContext
- Token stored in AsyncStorage and Keychain
- Axios interceptors handle token injection and refresh
- Both iOS and Android use localhost:7779 (Android via adb reverse)

**Navigation Structure**:
- Bottom tab navigator with Home, Projects, Media, Search, Settings
- Each tab has its own stack navigator for detail screens
- Theme colors applied to navigation bars and tab bars

**Platform-Specific Configuration**:
- Android requires `adb reverse tcp:7779 tcp:7779` for backend access
- iOS Simulator works with localhost directly
- Both platforms use Expo Go for development

## Development Notes

### Environment Setup
- Backend must be running at port 7779
- PostgreSQL via Docker Compose in backend directory
- Development token: `acf42bf1db704dd18e3c64e20f1e73da2f19f8c23cf3bdb7e23c9c2a3c5f1e2d`

### Known Issues
- Tab navigation may appear visual-only on Android emulator - manual clicks work
- Metro bundler occasionally needs port 8081 cleared before starting
- Theme changes apply globally including navigation bars