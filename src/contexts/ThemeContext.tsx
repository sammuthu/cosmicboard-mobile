import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { ThemeColors, UserTheme, ThemeTemplate } from '../types/theme';

interface ThemeContextValue {
  activeTheme: UserTheme | null;
  colors: ThemeColors | null;
  loading: boolean;
  templates: ThemeTemplate[];
  refreshTheme: () => Promise<void>;
  setTheme: (themeId: string, isGlobal?: boolean) => Promise<void>;
  customizeTheme: (themeId: string, customColors: ThemeColors) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@cosmicboard_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<UserTheme | null>(null);
  const [templates, setTemplates] = useState<ThemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTheme = async () => {
    try {
      setLoading(true);

      // Try to load user's active theme from backend
      try {
        const response = await apiService.getUserActiveTheme();
        console.log('Loaded active theme from backend:', response);

        const theme = response.data || response;  // Handle both {data: ...} and direct response

        if (theme && theme.colors) {
          setActiveTheme(theme);
          // Store locally for offline access
          await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
        }
      } catch (error) {
        console.log('Failed to load theme from backend, trying local storage:', error);

        // Fall back to locally stored theme
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
          const theme = JSON.parse(storedTheme);
          setActiveTheme(theme);
        } else {
          // Load default theme
          await loadDefaultTheme();
        }
      }

      // Load templates
      try {
        const templatesResponse = await apiService.getThemeTemplates();
        const templatesData = templatesResponse.data || templatesResponse;  // Handle both {data: ...} and direct response
        setTemplates(templatesData);
      } catch (error) {
        console.error('Failed to load theme templates:', error);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultTheme = async () => {
    try {
      const templatesResponse = await apiService.getThemeTemplates();
      const templatesData = templatesResponse.data || templatesResponse;
      const moonTheme = templatesData.find((t: ThemeTemplate) => t.name === 'moon') || templatesData[0];

      if (moonTheme) {
        const defaultTheme: UserTheme = {
          themeId: moonTheme.id,
          name: moonTheme.name,
          displayName: moonTheme.displayName,
          colors: moonTheme.colors,
          isCustomized: false
        };
        setActiveTheme(defaultTheme);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(defaultTheme));
      }
    } catch (error) {
      console.error('Failed to load default theme:', error);
    }
  };

  const setTheme = async (themeId: string, isGlobal: boolean = true) => {
    try {
      // Set theme on backend
      await apiService.setActiveTheme(themeId, isGlobal);

      // Reload theme from backend to get the updated theme
      await loadTheme();
    } catch (error) {
      console.error('Failed to set theme:', error);
      throw error;
    }
  };

  const customizeTheme = async (themeId: string, customColors: ThemeColors) => {
    try {
      // Save customization to backend
      await apiService.saveThemeCustomization(themeId, customColors);

      // Reload theme from backend
      await loadTheme();
    } catch (error) {
      console.error('Failed to customize theme:', error);
      throw error;
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        colors: activeTheme?.colors || null,
        loading,
        templates,
        refreshTheme,
        setTheme,
        customizeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}