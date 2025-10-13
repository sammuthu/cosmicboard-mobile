# Development Accounts Setup

This document explains the platform-specific development accounts configured for testing shared projects and discover feed features.

## Overview

The mobile app uses different development accounts for iOS and Android to enable proper testing of:
- Shared projects visibility between users
- Discover feed showing public content from other users
- Read-only access to public projects owned by other users
- User interaction features (likes, bookmarks, comments)

## Development Accounts

### iOS Account
- **Email**: nmuthu@gmail.com
- **Name**: Nmuthu
- **Access Token**: `63c1a0e1755fe9feba1a81d6b21fb181588577157eb14f0c98b380c679bbc916`
- **Token Expires**: ~10 years from 2025-10-12 (dev token doesn't expire)

### Android Account
- **Email**: sammuthu@me.com
- **Name**: Sam Muthu
- **Username**: sammuthu
- **Bio**: "Sharing my productivity journey with the CosmicBoard community! 🚀"
- **Access Token**: `b0d2f26f3cfff9169fd3b828177a2ce7f164dd0bbd3e81791f169e9694d70fd4`
- **Token Expires**: ~10 years from 2025-10-12 (dev token doesn't expire)

## How It Works

### Token Management (`src/services/api.ts`)

```typescript
constructor() {
  if (__DEV__) {
    // Platform-specific tokens
    this.token = Platform.OS === 'ios'
      ? '63c1a0e1755fe9feba1a81d6b21fb181...'  // nmuthu@gmail.com
      : 'b0d2f26f3cfff9169fd3b828177a2ce7...' // sammuthu@me.com

    axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
  }
}
```

### Refresh Token Skip

In development mode, tokens don't expire, so we skip the refresh logic:

```typescript
async refreshAuthToken() {
  if (__DEV__) {
    console.log('🔑 Dev mode: Skipping token refresh (using hardcoded token)');
    return this.token;
  }
  // Production refresh logic...
}
```

## Testing Workflow

### 1. Create Public Project on iOS (nmuthu@gmail.com)
1. Open app on iOS device/simulator
2. Create a new project
3. Change visibility to "Public" (🌍)
4. Add tasks, notes, media

### 2. View on Android (sammuthu@me.com)
1. Open app on Android device/emulator
2. Navigate to Discover tab
3. See the public project from nmuthu@gmail.com
4. Tap to view project details (read-only mode)
5. Cannot edit or modify (not the owner)

### 3. Verify Permissions
- ✅ Owner can see all projects (public, contacts, private)
- ✅ Other users can see only PUBLIC projects
- ✅ Read-only mode for non-owners viewing public projects
- ✅ Discover feed shows only public content

## Regenerating Tokens

If tokens expire or need to be regenerated, use the backend API:

```bash
# For iOS (nmuthu@gmail.com)
curl -X POST 'http://localhost:7779/api/auth/setup-dev-auth' \
  -H 'Content-Type: application/json' \
  -d '{"email": "nmuthu@gmail.com"}'

# For Android (sammuthu@me.com)
curl -X POST 'http://localhost:7779/api/auth/setup-dev-auth' \
  -H 'Content-Type: application/json' \
  -d '{"email": "sammuthu@me.com"}'
```

Then update the tokens in `src/services/api.ts`.

## Backend Configuration

The backend `/setup-dev-auth` endpoint:
- Only works in development mode (NODE_ENV !== 'production')
- Requires LocalStack to be running
- Creates or finds user by email
- Generates long-lived access tokens (for dev convenience)
- Returns both access and refresh tokens

## Network Requirements

### Android (Emulator)
Requires ADB reverse port forwarding:
```bash
adb reverse tcp:7779 tcp:7779  # Backend API
adb reverse tcp:4566 tcp:4566  # LocalStack
```

### iOS (Simulator)
Uses `localhost` directly:
- Backend: `http://localhost:7779`
- LocalStack: `http://localhost:4566`

## Troubleshooting

### "No refresh token available" Error
- **Cause**: Refresh logic triggered in dev mode
- **Fix**: Already handled - dev mode skips refresh
- **Verify**: Check logs for "🔑 Dev mode: Skipping token refresh"

### "Invalid or expired token" Error
- **Cause**: Token was revoked or expired
- **Fix**: Regenerate tokens using `/setup-dev-auth` endpoint
- **Update**: Replace tokens in `src/services/api.ts`

### Projects Not Showing in Discover Feed
- **Cause**: No public projects created yet
- **Fix**: Create project on one account, set visibility to PUBLIC
- **Verify**: Check project visibility dropdown shows 🌍 (Public)

### Android Can't Connect to Backend
- **Cause**: Missing ADB port forwarding
- **Fix**: Run `adb reverse tcp:7779 tcp:7779`
- **Verify**: `adb reverse --list` shows the forwarding

## Security Notes

⚠️ **Important**: These are development tokens only!

- Never commit production tokens to git
- Development tokens are long-lived for convenience
- Production uses proper JWT with short expiration
- Refresh tokens used in production for token renewal
- Magic link authentication for production login flow

## Related Files

- `/src/services/api.ts` - Token configuration
- `/src/hooks/useDiscoverFeed.ts` - Discover feed logic
- `/src/screens/DiscoverScreen.tsx` - Discover UI
- `/src/components/DiscoverContentCard.tsx` - Content cards
- Backend: `/src/routes/auth.ts` - Auth endpoints
- Backend: `/src/services/auth.service.ts` - Auth logic
