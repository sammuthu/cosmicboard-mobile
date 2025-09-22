import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { deepMerge } from '../utils/deepMerge';
import { DEFAULT_THEMES } from '../utils/defaultThemes';
import { getDeviceType } from '../utils/deviceHelper';

// Theme types matching backend
export interface ThemeColors {
  parentBackground: {
    from: string;
    via: string;
    to: string;
  };
  prismCard: {
    background: {
      from: string;
      via: string;
      to: string;
    };
    glowGradient: {
      from: string;
      via: string;
      to: string;
    };
    borderColor: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  buttons: {
    primary: {
      background: string;
      hover: string;
      text: string;
    };
    secondary: {
      background: string;
      hover: string;
      text: string;
    };
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface ThemeTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  colors: ThemeColors;
}

export interface UserTheme {
  id: string;
  userId: string;
  themeId: string;
  theme: ThemeTemplate;
  customColors?: Partial<ThemeColors>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert database theme to legacy mobile format for backward compatibility
const convertToMobileTheme = (colors: ThemeColors) => {
  return {
    colors: {
      background: {
        primary: colors.parentBackground.from,
        secondary: colors.parentBackground.via,
        tertiary: colors.parentBackground.to,
        card: colors.prismCard.background.from,
        elevated: colors.prismCard.background.via,
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
        muted: colors.text.muted,
      },
      cosmic: {
        purple: colors.buttons.primary.background,
        pink: colors.prismCard.glowGradient.from,
        blue: colors.buttons.secondary.background,
        cyan: colors.text.accent,
        amber: colors.status.warning,
        green: colors.status.success,
      },
      priority: {
        supernova: colors.status.error,
        stellar: colors.status.warning,
        nebula: colors.status.info,
      },
      status: {
        active: colors.status.info,
        completed: colors.status.success,
        deleted: colors.status.error,
      },
      ui: {
        border: colors.prismCard.borderColor,
        divider: colors.prismCard.borderColor,
      },
    }
  };
};


interface ThemeContextType {
  theme: ReturnType<typeof convertToMobileTheme>;
  themeName: string;
  setTheme: (id: string) => Promise<void>;
  activeTheme: UserTheme | null;
  availableThemes: ThemeTemplate[];
  customizations: any[];
  loading: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState<UserTheme | null>(null);
  const [availableThemes, setAvailableThemes] = useState<ThemeTemplate[]>(DEFAULT_THEMES);
  const [customizations, setCustomizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Don't show loading since we have default themes
  const [currentColors, setCurrentColors] = useState<ThemeColors>(DEFAULT_THEMES[0].colors);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const deviceType = getDeviceType();

      // Try to load themes from backend to get latest color profiles
      // But don't block on this - use defaults immediately
      setTimeout(async () => {
        try {
          console.log('Attempting to sync theme templates from API...');
          const templates = await apiService.getThemeTemplates();
          if (templates && templates.length > 0) {
            console.log('Synced themes from backend:', templates.length);
            setAvailableThemes(templates);
          }
          // Also try to get user's active theme with device-specific preference
          try {
            const userTheme = await apiService.getUserActiveTheme(deviceType);
            if (userTheme) {
              console.log('Loaded user active theme:', userTheme);
              // Find the template for the active theme
              const template = templates.find((t: ThemeTemplate) => t.id === userTheme.themeId);
              if (template) {
                setActiveTheme({
                  ...userTheme,
                  theme: template,
                } as UserTheme & { scope?: string; isGlobal?: boolean; deviceType?: string });
                setCurrentColors(userTheme.colors || template.colors);
              }
            }
          } catch (error) {
            console.log('Could not load user active theme');
          }
        } catch (apiError) {
          console.log('Could not sync themes from backend, using defaults');
        }
      }, 1000); // Try after a delay to let auth settle

      // Try to get user's saved theme preference
      const savedThemeId = await AsyncStorage.getItem('selectedTheme');
      if (savedThemeId) {
        const selectedTheme = availableThemes.find(t => t.id === savedThemeId);
        if (selectedTheme) {
          setCurrentColors(selectedTheme.colors);
          setActiveTheme({
            id: savedThemeId,
            userId: 'local-user',
            themeId: savedThemeId,
            theme: selectedTheme,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as UserTheme);
        }
      }
    } catch (error) {
      console.error('Error in loadTheme:', error);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  const setTheme = async (themeId: string) => {
    try {
      // Try to save to backend first (will use auth token from AuthContext)
      try {
        await apiService.setActiveTheme(themeId);
        await loadTheme();
      } catch (backendError: any) {
        // If backend save fails (e.g., 401), save locally as fallback
        if (backendError.response?.status === 401 || __DEV__) {
          console.log('Backend theme save failed, saving locally');

          // Find the theme template
          const selectedTheme = availableThemes.find((t: ThemeTemplate) => t.id === themeId);
          if (selectedTheme) {
            setActiveTheme({
              id: themeId,
              userId: 'local-user',
              themeId: themeId,
              theme: selectedTheme,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as UserTheme);
            setCurrentColors(selectedTheme.colors);
          }
        } else {
          throw backendError;
        }
      }

      // Always save locally as well for quick access
      await AsyncStorage.setItem('selectedTheme', themeId);
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  };

  const value = {
    theme: convertToMobileTheme(currentColors),
    themeName: activeTheme?.theme?.name || 'moon',
    setTheme,
    activeTheme,
    availableThemes,
    customizations,
    loading,
    refreshTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};