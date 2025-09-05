# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CosmicBoard Mobile is a React Native (Expo) project management application with a cosmic/space theme. It's a cloud-first mobile companion to the CosmicBoard web app, sharing the same MongoDB backend and subscription model.

## Technology Stack

- **Framework**: React Native 0.79.5 with Expo SDK 53
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **API Client**: Axios with interceptors for auth
- **UI Components**: Custom PrismCard components with gradient effects
- **Icons**: lucide-react-native
- **Code Highlighting**: react-native-syntax-highlighter

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
```

## Project Architecture

### Directory Structure
- `/src/components` - Reusable UI components (PrismCard, SyntaxHighlight, CodeDisplay)
- `/src/models` - TypeScript interfaces (Project, Task, Reference)
- `/src/navigation` - Navigation setup with typed routes
- `/src/screens` - Screen components for each view
- `/src/services` - API service (`api.ts`) and unused storage service
- `/src/styles` - Theme colors and shared styles

### Key Architectural Patterns

1. **Cloud-First Data Management**: All data operations go through `ApiService` singleton in `/src/services/api.ts`. Direct connection to MongoDB backend shared with web app. Note: `storage.ts` exists but is unused legacy code.

2. **Authentication**: Secure token storage using react-native-keychain with automatic token refresh via axios interceptors. Platform-specific API URLs (Android emulator uses `10.0.2.2`, iOS uses `localhost`).

3. **State Management**: Currently uses manual React state management with `useState` and `useEffect`. React Query is installed but not implemented.

4. **Navigation Types**: Strongly typed navigation using `RootStackParamList` and `MainTabParamList` in `/src/navigation/AppNavigator.tsx`.

5. **Data Model Relationships**:
   - Projects have many Tasks and References (linked by projectId)
   - Tasks have priority levels (SUPERNOVA, STELLAR, NEBULA) and status states
   - References are categorized as snippets or documentation
   - Note: API uses `_id` field while some interfaces use `id`

### Important Implementation Details

- **API Service Pattern**: Singleton pattern with platform-aware URL configuration
- **Custom UI Components**: PrismCard uses elaborate border effects with positioned views
- **Authentication Flow**: Token stored in keychain, auto-refresh on 401 responses
- **Screen Pattern**: Direct API calls in components with manual state management
- **Color Theme**: Cosmic-themed gradients in `/src/styles/colors.ts`
- **TypeScript**: Strict mode enabled but watch for `id` vs `_id` inconsistencies