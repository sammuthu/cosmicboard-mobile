# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Web-Mobile Sync Instructions
**IMPORTANT**: Before starting any work, read the comprehensive sync instructions in `MOBILE_SYNC_INSTRUCTIONS.md`. This file contains all recent web changes that must be implemented in the mobile app.

## Project Overview

CosmicBoard Mobile is a React Native (Expo SDK 53) project management application with a cosmic/space theme. It's a cloud-first mobile companion to the CosmicBoard web app, sharing the same PostgreSQL backend (via Prisma) and authentication system. The app must maintain feature parity with the web frontend while providing mobile-optimized UX.

## Technology Stack

- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Storage**: AsyncStorage for local data persistence, MMKV for fast key-value storage
- **UI Components**: Custom PrismCard components with gradient effects (expo-linear-gradient)
- **Icons**: lucide-react-native
- **Authentication**: react-native-keychain for secure token storage

## Common Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Start complete development environment (iOS + backend check)
./start.sh

# Start without backend check
./start.sh --no-backend

# Fix Android-specific issues
./fix-android.sh

# Fix native module issues
./fix-native-modules.sh
```

## Project Architecture

### Directory Structure
- `/src/components` - Reusable UI components (PrismCard, CodeDisplay, SyntaxHighlight)
- `/src/models` - TypeScript interfaces (Project, Task, Reference, MediaFile)
- `/src/navigation` - Navigation setup with typed routes
- `/src/screens` - Screen components for each view
- `/src/services` - Business logic (api.ts for backend, auth.service.ts for authentication)
- `/src/styles` - Theme colors and shared styles
- `/src/contexts` - React contexts for global state

### Key Architectural Patterns

1. **Cloud-First Data Management**: All data operations go through `ApiService` singleton in `/src/services/api.ts`. This service connects to the PostgreSQL backend shared with the web app.

2. **Authentication**: Magic link (passwordless) authentication with secure token storage using AsyncStorage. Automatic token refresh via axios interceptors.

3. **State Management**: React Query for server state management with caching and automatic refetching.

4. **Navigation Types**: Strongly typed navigation using `RootStackParamList` and `MainTabParamList` in `/src/navigation/AppNavigator.tsx`.

5. **Data Model Relationships** (same as web app):
   - Projects have many Tasks and References (linked by projectId)
   - Tasks have priority levels (SUPERNOVA, STELLAR, NEBULA) and status states
   - References are categorized as snippets or documentation
   - Media files support photos, screenshots, and PDFs

### API Configuration

- **Backend Port**: http://localhost:7778 (note: documentation mentions 7779 but code uses 7778)
- **Platform-specific URLs**:
  - Android emulator: `http://10.0.2.2:7778/api`
  - iOS simulator: `http://localhost:7778/api`
  - Production: `https://cosmicspace.app/api`
- **Database**: PostgreSQL via Prisma (NOT MongoDB)
- **NO Database Migrations**: Database is already set up and working

### Important Implementation Details

- **Secure Storage**: Auth tokens in AsyncStorage, sensitive data in react-native-keychain
- **Color Theme**: Cosmic-themed gradients with multiple theme options
- **TypeScript**: Strict mode enabled - ensure all types are properly defined
- **Error Handling**: Automatic logout on 401, token refresh on expiry
- **Media Support**: Image picker for photos, PDF viewer, markdown rendering
- **Platform Differences**: Handle Android emulator localhost (10.0.2.2) vs iOS (localhost)

## 🤖 AUTOMATED IMPLEMENTATION INSTRUCTIONS

When you receive the command "sync with web" or similar, you must:

1. **Read MOBILE_SYNC_INSTRUCTIONS.md** first
2. **Remove any database migration commands** from scripts
3. **Automatically run start.sh or npm run android** to launch emulator/simulator
4. **Take screenshots** at each implementation step (if possible)
5. **Detect and fix errors** from console logs
6. **Continue iterating** until all features work without errors
7. **Test both platforms** (iOS and Android)
8. **Never ask for manual intervention** - fix everything automatically

### Permissions Granted
- ✅ Full permission to modify any files
- ✅ Launch emulators/simulators automatically
- ✅ Install npm packages as needed
- ✅ Run any commands necessary
- ✅ Fix errors without asking
- ✅ Iterate until everything works

### Expected Behavior
- Start with `npm run android` for Android testing or `./start.sh` for iOS
- Monitor console for errors and fix automatically
- Continue until no errors remain
- Ensure feature parity with web frontend
- Maintain mobile-optimized UX patterns

## Testing and Development Workflow

### Development Server Startup
The `start.sh` script handles the complete development environment:
1. Checks backend server availability (port 7778)
2. Optionally starts PostgreSQL database via Docker
3. Installs npm dependencies if needed
4. Installs iOS CocoaPods (macOS only)
5. Cleans up existing Metro processes
6. Starts Metro bundler and development server
7. Launches iOS simulator

### Platform-Specific Testing
- **Android**: Use `npm run android` or Android Studio emulator
- **iOS**: Use `npm run ios` or `./start.sh` (macOS only)
- **Web**: Use `npm run web` (port 8082)

### Common Issues and Solutions
- **Metro port conflicts**: Script automatically kills existing Metro processes
- **Native module issues**: Run `./fix-native-modules.sh`
- **Android build issues**: Run `./fix-android.sh`
- **Pod installation**: Handled automatically by start.sh on macOS