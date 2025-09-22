# Mobile Sync Instructions - Theme System & Latest Features

## Overview
This document contains instructions to implement the database-driven theme customization system and other recent web features in the mobile app. These are NEW features not yet in mobile that need implementation.

## 🎨 NEW: Database-Driven Theme Customization System

### Overview
The web app now has a comprehensive theme system that:
- Stores 8 default themes in PostgreSQL database
- Allows users to customize any theme's colors
- Saves customizations per user
- Applies themes dynamically using CSS variables (web) / style props (mobile)
- Provides live preview during customization

### Backend API Endpoints (Already Available)
```
GET  /api/themes/templates           - Get all theme templates
GET  /api/themes/templates/:id       - Get specific theme template
GET  /api/themes/user/active         - Get user's active theme (with customizations merged)
GET  /api/themes/user/customizations - Get all user customizations
POST /api/themes/user/customize      - Save theme customization
POST /api/themes/user/set-active     - Set active theme
DELETE /api/themes/user/customizations/:id - Delete customization
```

### Theme Data Structure
```typescript
interface ThemeTemplate {
  id: string           // e.g., 'moon', 'sun', 'daylight'
  name: string         // Internal name
  displayName: string  // Display name
  description: string
  isDefault: boolean
  colors: ThemeColors
}

interface ThemeColors {
  parentBackground: {
    from: string  // rgba or hex
    via: string
    to: string
  }
  prismCard: {
    background: {
      from: string
      via: string
      to: string
    }
    glowGradient: {
      from: string
      via: string
      to: string
    }
    borderColor: string
  }
  text: {
    primary: string
    secondary: string
    accent: string
    muted: string
  }
  buttons: {
    primary: {
      background: string
      hover: string
      text: string
    }
    secondary: {
      background: string
      hover: string
      text: string
    }
  }
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
}
```

### Mobile Implementation Requirements

#### 1. ThemeContext Provider
```javascript
// src/contexts/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api';

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState(null);
  const [colors, setColors] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTheme = async () => {
    try {
      const theme = await apiClient.get('/themes/user/active');
      setActiveTheme(theme);
      setColors(theme.colors);
      // Apply theme to React Native components
      applyThemeToApp(theme.colors);
    } catch (error) {
      // Load default theme for non-authenticated users
      const templates = await apiClient.get('/themes/templates');
      const defaultTheme = templates.find(t => t.id === 'moon') || templates[0];
      setActiveTheme(defaultTheme);
      setColors(defaultTheme.colors);
    } finally {
      setLoading(false);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, colors, loading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

#### 2. Theme Gallery Screen
```javascript
// src/screens/themes/ThemeGalleryScreen.js
// Features needed:
// - Grid of theme cards (2 columns on mobile)
// - Each card shows theme preview with gradient background
// - Color swatches preview
// - "Active" badge for current theme
// - "Customized" badge for themes with user customizations
// - Apply button to set theme as active
// - Entire card clickable to open customization
// - Loading states and error handling
```

#### 3. Theme Customization Screen
```javascript
// src/screens/themes/ThemeCustomizationScreen.js
// Features needed:
// - Tab navigation for color sections (Background, Cards, Text, Buttons, Status)
// - Color pickers for each customizable color
// - Support for both hex and rgba formats
// - Live preview of theme changes
// - Save button to persist customizations
// - Reset button to restore defaults (with silent deletion)
// - Navigation back to gallery after reset
```

#### 4. Home Screen Theme Selector Integration
```javascript
// Update existing HomeScreen.js
// - Sync theme selector with backend active theme
// - Apply theme when icon is selected
// - Show loading state during theme application
// - Persist selection to backend for authenticated users
// - Fall back to AsyncStorage for non-authenticated users
```

#### 5. Color Picker Component
```javascript
// src/components/ColorPicker.js
// Use react-native-color-picker or similar library
// Features:
// - Convert between hex and rgba
// - Preserve alpha values
// - Show color preview square
// - Text input for manual entry
```

## 🔧 Additional Updates Needed

### 1. PrismCard Component Updates
- Apply theme colors from ThemeContext instead of hardcoded values
- Use LinearGradient with theme colors for backgrounds
- Dynamic border colors from theme

### 2. API Client Updates
Add theme-related methods:
```javascript
// src/services/api.js
export const themesAPI = {
  getTemplates: () => apiClient.get('/themes/templates'),
  getTemplate: (id) => apiClient.get(`/themes/templates/${id}`),
  getUserActive: () => apiClient.get('/themes/user/active'),
  getUserCustomizations: () => apiClient.get('/themes/user/customizations'),
  saveCustomization: (themeId, colors) =>
    apiClient.post('/themes/user/customize', { themeId, customColors: colors }),
  setActive: (themeId) =>
    apiClient.post('/themes/user/set-active', { themeId }),
  deleteCustomization: (id) =>
    apiClient.delete(`/themes/user/customizations/${id}`)
};
```

### 3. Navigation Updates
Add theme screens to navigation:
```javascript
// Theme Stack
- ThemeGalleryScreen (list of themes)
- ThemeCustomizationScreen (edit theme colors)
```

### 4. Deep Merge Utility
```javascript
// src/utils/deepMerge.js
export const deepMerge = (target, source) => {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    } else {
      output[key] = source[key];
    }
  }
  return output;
};
```

## 🎯 Implementation Priority

1. **Phase 1: Core Theme System**
   - [ ] ThemeContext provider
   - [ ] Theme API integration
   - [ ] Apply theme colors to existing components

2. **Phase 2: Theme Gallery**
   - [ ] Theme gallery screen
   - [ ] Theme cards with preview
   - [ ] Apply theme functionality

3. **Phase 3: Theme Customization**
   - [ ] Customization screen
   - [ ] Color pickers
   - [ ] Save/Reset functionality
   - [ ] Live preview

4. **Phase 4: Integration**
   - [ ] Home screen theme selector sync
   - [ ] Update all components to use theme colors
   - [ ] Testing and refinement

## 📦 Required Dependencies

```json
{
  "react-native-color-picker": "^0.6.0",
  "react-native-linear-gradient": "^2.8.3",
  "react-native-vector-icons": "^10.0.0"
}
```

## 🧪 Testing Checklist

- [ ] Theme templates load from backend
- [ ] Theme application changes all UI colors
- [ ] Customizations save to backend
- [ ] Reset removes customizations silently
- [ ] Theme persists across app restarts
- [ ] Non-authenticated users can view themes
- [ ] Authenticated users can customize themes
- [ ] Deep merge works for nested color objects
- [ ] Color picker handles hex/rgba conversion
- [ ] Performance is acceptable with theme changes

## 🐛 Known Issues to Avoid

1. **Color Format Consistency**: Always handle both hex and rgba formats
2. **Deep Merge**: Required for nested theme color objects
3. **Reset Button**: Must silently delete without confirmation
4. **Theme Persistence**: Apply on app launch from backend
5. **Navigation**: Reset should navigate back after deletion

## 📱 Mobile-Specific Considerations

1. Use `StyleSheet.create()` with theme colors
2. Update styles dynamically when theme changes
3. Cache theme locally for offline access
4. Use native color picker components
5. Optimize re-renders when theme changes
6. Consider dark mode system preference

## ✅ Success Criteria

- Database-driven themes work identically to web
- All 8 default themes available (Moon, Sun, Daylight, Comet, Earth, Rocket, Saturn, Sparkle)
- Users can customize any theme
- Customizations persist per user
- Theme applies instantly across entire app
- Color pickers work for all color fields
- Reset functionality works silently
- Performance remains smooth