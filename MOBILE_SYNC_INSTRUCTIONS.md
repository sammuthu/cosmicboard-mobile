# Mobile Sync Instructions - Complete Web Feature Parity

## Overview
This document contains comprehensive instructions to sync the mobile app with all recent web frontend changes made in the last 3 days. The mobile app must achieve feature parity with the web frontend while maintaining mobile-friendly UX patterns.

## Recent Web Changes Summary

### 1. Homepage Redesign (Latest)
- **Theme Selector Container**: Unified container with theme icons and user avatar
- **User Avatar**: Positioned on the right side of theme selector, shows circular badge with user initial
- **Title/Description**: Moved below theme selector with gradient text effects
- **Feature Buttons**: Grid layout in rounded rectangular container with cell borders
- **Z-index Hierarchy Fix**: Proper stacking context for dropdown menus

### 2. Authentication System
- **Magic Link Auth**: Email-based passwordless authentication
- **Token Storage**: Uses localStorage for auth tokens
- **Protected Routes**: Automatic redirect to /auth when not authenticated
- **User Context**: Global auth state management with useAuth hook

### 3. Media Management System
- **Photo Gallery**: Grid view with lightbox, upload, rename, delete
- **Screenshot Capture**: Paste from clipboard (Cmd/Ctrl+V)
- **PDF Viewer**: In-app viewing with zoom and navigation
- **File Upload**: Drag-and-drop and click-to-upload
- **Thumbnail Generation**: Automatic for images

### 4. Backend Integration
- **API Endpoints**: All at http://localhost:7779
- **External Backend**: NEXT_PUBLIC_USE_EXTERNAL_BACKEND=true
- **Database**: PostgreSQL via Prisma (no MongoDB)
- **Media Storage**: Local filesystem at /uploads

### 5. UI/UX Patterns
- **PrismCard Design**: Glassmorphic cards with gradient borders
- **Cosmic Themes**: 5+ themes with dynamic animations
- **Keyboard Shortcuts**: Cmd/Ctrl+K for search, Cmd/Ctrl+V for screenshots
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeleton loaders and spinners

## Mobile Implementation Requirements

### 1. Core Setup
```javascript
// Environment variables needed
BACKEND_URL=http://localhost:7779
USE_EXTERNAL_BACKEND=true
DATABASE_URL=postgresql://cosmicuser:cosmic123!@localhost:5432/cosmicboard
```

### 2. Authentication Flow
- Implement magic link authentication screen
- Store tokens in AsyncStorage (mobile equivalent of localStorage)
- Create AuthContext provider wrapping the app
- Protected navigation routes

### 3. Homepage Layout (Mobile-Optimized)
```javascript
// Mobile-friendly layout structure
<ScrollView>
  {/* Theme Selector Section */}
  <View style={styles.themeContainer}>
    <ScrollView horizontal>
      {/* Theme icons */}
    </ScrollView>
    <TouchableOpacity style={styles.avatar}>
      {/* User avatar with initial */}
    </TouchableOpacity>
  </View>
  
  {/* Title Section */}
  <View style={styles.titleSection}>
    <Text style={styles.gradientTitle}>Cosmic Space</Text>
    <Text style={styles.subtitle}>Align your actions with the cosmos</Text>
  </View>
  
  {/* Feature Grid */}
  <View style={styles.featureGrid}>
    {/* 2 columns on mobile */}
  </View>
  
  {/* Current Priority */}
  <CurrentPriority />
  
  {/* Projects List */}
  <ProjectsList />
</ScrollView>
```

### 4. Navigation Structure
```javascript
// React Navigation setup
- Auth Stack
  - LoginScreen (magic link)
- Main Tab Navigator
  - Home
  - Projects
  - Media
  - Settings
- Modal Screens
  - Search
  - New Project
  - File Viewer
```

### 5. Media Features (Mobile-Specific)
- **Photo Gallery**: Use React Native Image component with FlatList
- **Screenshot**: Not applicable - use camera/gallery picker instead
- **PDF Viewer**: Use react-native-pdf or WebView
- **File Upload**: Use react-native-document-picker
- **Image Viewer**: Use react-native-image-zoom-viewer for lightbox

### 6. API Client Setup
```javascript
// Centralized API client
class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:7779/api';
  }
  
  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('auth_token');
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
}
```

### 7. Component Mapping (Web to Mobile)

| Web Component | Mobile Component | Implementation Notes |
|--------------|-----------------|---------------------|
| PrismCard | View with LinearGradient border | Use react-native-linear-gradient |
| UserAvatar | TouchableOpacity with Text | Circular view with initial |
| ThemeSelector | Horizontal ScrollView | Scrollable theme icons |
| SearchModal | Modal with TextInput | Full-screen modal |
| FileUpload | DocumentPicker | Native file selection |
| PDFViewer | react-native-pdf | Full-screen viewer |
| PhotoGallery | FlatList with Image | Grid layout with 2 columns |
| Toast | react-native-toast-message | Native toast notifications |
| Dropdown Menu | ActionSheet or Modal | iOS/Android native patterns |

### 8. Styling Guidelines
```javascript
// Mobile-specific considerations
- Use StyleSheet.create() for performance
- Responsive sizing with Dimensions API
- Platform-specific styles (Platform.OS)
- SafeAreaView for notch/status bar
- KeyboardAvoidingView for forms
- Proper touch target sizes (min 44x44)
```

### 9. State Management
- Use Context API for global state (auth, theme)
- Local component state with useState
- Data fetching with custom hooks
- Optimistic updates for better UX

### 10. Performance Optimizations
- FlatList for long lists
- Image caching with FastImage
- Lazy loading for heavy components
- Memoization with useMemo/useCallback
- Proper key props for lists

## Testing Requirements

### Android Testing (start-android.sh)
1. Launch Android emulator automatically
2. Take screenshots of each screen
3. Verify all features work
4. Check for console errors
5. Test on different screen sizes
6. Verify keyboard interactions
7. Test offline behavior

### iOS Testing (start.sh)
1. Launch iOS simulator automatically
2. Take screenshots of each screen
3. Verify all features work
4. Test gesture navigation
5. Verify safe area handling
6. Test on iPhone and iPad

## File Structure Updates Needed

```
cosmicboard-mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   └── LoginScreen.js (magic link)
│   │   ├── home/
│   │   │   └── HomeScreen.js (new layout)
│   │   ├── media/
│   │   │   ├── PhotoGalleryScreen.js
│   │   │   └── PDFViewerScreen.js
│   │   └── projects/
│   │       └── ProjectsScreen.js
│   ├── components/
│   │   ├── UserAvatar.js
│   │   ├── ThemeSelector.js
│   │   ├── PrismCard.js
│   │   ├── CurrentPriority.js
│   │   └── FeatureGrid.js
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── services/
│   │   └── api.js (backend integration)
│   └── navigation/
│       └── AppNavigator.js
├── start-android.sh (no DB migrations)
└── start.sh (no DB migrations)
```

## Dependencies to Add

```json
{
  "dependencies": {
    "react-native-linear-gradient": "^2.8.3",
    "react-native-document-picker": "^9.1.1",
    "react-native-pdf": "^6.7.4",
    "react-native-image-zoom-viewer": "^3.0.1",
    "react-native-toast-message": "^2.2.0",
    "react-native-fast-image": "^8.6.3",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.1",
    "react-native-reanimated": "^3.6.1",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/stack": "^6.3.20"
  }
}
```

## Critical Implementation Notes

1. **NO Database Migrations**: The PostgreSQL database is already set up and working. Remove any migration commands from start scripts.

2. **Backend is Shared**: The backend at port 7779 is already configured for both web and mobile. No backend changes needed.

3. **Auth Token Format**: Must match web format exactly:
   ```json
   {
     "accessToken": "token",
     "refreshToken": "token",
     "expiresAt": "ISO date string"
   }
   ```

4. **API Endpoints**: All endpoints use /api prefix:
   - POST /api/auth/magic-link
   - GET /api/projects
   - GET /api/tasks
   - GET /api/media
   - POST /api/media/upload
   - etc.

5. **Error Handling**: Implement proper error boundaries and fallback UI

6. **Offline Support**: Cache critical data for offline access

## Automated Testing Process

The mobile implementation should:
1. Automatically launch emulators/simulators
2. Take screenshots at each step
3. Detect errors from screenshots and logs
4. Self-correct and retry until working
5. Verify feature parity with web
6. Ensure mobile-optimized UX

## Success Criteria

✅ Authentication flow works (magic link)
✅ Homepage shows new layout with user avatar in theme selector
✅ All theme switching works with animations
✅ Dropdown menus have proper z-index (use native sheets)
✅ Projects CRUD operations work
✅ Tasks management works
✅ Media features work (adapted for mobile)
✅ Search functionality works
✅ No console errors
✅ Smooth performance on device
✅ Proper keyboard handling
✅ Safe area compliance
✅ Gesture navigation works

## Post-Implementation Checklist

- [ ] All screens implemented
- [ ] Navigation working
- [ ] API integration complete
- [ ] Auth flow tested
- [ ] Media features working
- [ ] Theme switching smooth
- [ ] No console errors
- [ ] Screenshots captured
- [ ] Android tested
- [ ] iOS tested
- [ ] Performance acceptable
- [ ] Offline handling works