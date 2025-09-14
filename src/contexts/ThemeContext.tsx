import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'cosmic' | 'nebula' | 'stellar' | 'aurora' | 'quantum' | 'daylight';

export interface Theme {
  name: ThemeName;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
      elevated: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    cosmic: {
      purple: string;
      pink: string;
      blue: string;
      cyan: string;
      amber: string;
      green: string;
    };
    priority: {
      supernova: string;
      stellar: string;
      nebula: string;
    };
    status: {
      active: string;
      completed: string;
      deleted: string;
    };
    ui: {
      border: string;
      divider: string;
    };
  };
}

const themes: Record<ThemeName, Theme> = {
  cosmic: {
    name: 'cosmic',
    colors: {
      background: {
        primary: '#0a0a0f',
        secondary: '#1a1a2e',
        tertiary: '#2a2a3e',
        card: '#16213e',
        elevated: '#1e2841',
      },
      text: {
        primary: '#ffffff',
        secondary: '#9ca3af',
        muted: '#6b7280',
      },
      cosmic: {
        purple: '#8b5cf6',
        pink: '#ec4899',
        blue: '#3b82f6',
        cyan: '#06b6d4',
        amber: '#f59e0b',
        green: '#10b981',
      },
      priority: {
        supernova: '#ef4444',
        stellar: '#f59e0b',
        nebula: '#3b82f6',
      },
      status: {
        active: '#3b82f6',
        completed: '#10b981',
        deleted: '#ef4444',
      },
      ui: {
        border: '#374151',
        divider: '#4b5563',
      },
    },
  },
  nebula: {
    name: 'nebula',
    colors: {
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
        card: '#1e293b',
        elevated: '#334155',
      },
      text: {
        primary: '#f1f5f9',
        secondary: '#94a3b8',
        muted: '#64748b',
      },
      cosmic: {
        purple: '#a78bfa',
        pink: '#f9a8d4',
        blue: '#60a5fa',
        cyan: '#22d3ee',
        amber: '#fbbf24',
        green: '#34d399',
      },
      priority: {
        supernova: '#f87171',
        stellar: '#fbbf24',
        nebula: '#60a5fa',
      },
      status: {
        active: '#60a5fa',
        completed: '#34d399',
        deleted: '#f87171',
      },
      ui: {
        border: '#475569',
        divider: '#64748b',
      },
    },
  },
  stellar: {
    name: 'stellar',
    colors: {
      background: {
        primary: '#18181b',
        secondary: '#27272a',
        tertiary: '#3f3f46',
        card: '#27272a',
        elevated: '#3f3f46',
      },
      text: {
        primary: '#fafafa',
        secondary: '#a1a1aa',
        muted: '#71717a',
      },
      cosmic: {
        purple: '#c084fc',
        pink: '#f0abfc',
        blue: '#93c5fd',
        cyan: '#67e8f9',
        amber: '#fcd34d',
        green: '#86efac',
      },
      priority: {
        supernova: '#fca5a5',
        stellar: '#fcd34d',
        nebula: '#93c5fd',
      },
      status: {
        active: '#93c5fd',
        completed: '#86efac',
        deleted: '#fca5a5',
      },
      ui: {
        border: '#52525b',
        divider: '#71717a',
      },
    },
  },
  aurora: {
    name: 'aurora',
    colors: {
      background: {
        primary: '#0a0e1a',
        secondary: '#162033',
        tertiary: '#22324d',
        card: '#1a2842',
        elevated: '#22324d',
      },
      text: {
        primary: '#e0f2fe',
        secondary: '#7dd3c0',
        muted: '#5eead4',
      },
      cosmic: {
        purple: '#c4b5fd',
        pink: '#fbcfe8',
        blue: '#bfdbfe',
        cyan: '#a5f3fc',
        amber: '#fed7aa',
        green: '#bbf7d0',
      },
      priority: {
        supernova: '#fecaca',
        stellar: '#fed7aa',
        nebula: '#bfdbfe',
      },
      status: {
        active: '#bfdbfe',
        completed: '#bbf7d0',
        deleted: '#fecaca',
      },
      ui: {
        border: '#2dd4bf',
        divider: '#5eead4',
      },
    },
  },
  quantum: {
    name: 'quantum',
    colors: {
      background: {
        primary: '#120826',
        secondary: '#1f0f3d',
        tertiary: '#2e1855',
        card: '#241142',
        elevated: '#2e1855',
      },
      text: {
        primary: '#e9d5ff',
        secondary: '#c084fc',
        muted: '#a855f7',
      },
      cosmic: {
        purple: '#d8b4fe',
        pink: '#f5d0fe',
        blue: '#c7d2fe',
        cyan: '#cffafe',
        amber: '#fef3c7',
        green: '#d9f99d',
      },
      priority: {
        supernova: '#fda4af',
        stellar: '#fef3c7',
        nebula: '#c7d2fe',
      },
      status: {
        active: '#c7d2fe',
        completed: '#d9f99d',
        deleted: '#fda4af',
      },
      ui: {
        border: '#7c3aed',
        divider: '#a855f7',
      },
    },
  },
  daylight: {
    name: 'daylight',
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        card: '#ffffff',
        elevated: '#f8fafc',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#94a3b8',
      },
      cosmic: {
        purple: '#7c3aed',
        pink: '#ec4899',
        blue: '#2563eb',
        cyan: '#0891b2',
        amber: '#f59e0b',
        green: '#10b981',
      },
      priority: {
        supernova: '#dc2626',
        stellar: '#f59e0b',
        nebula: '#2563eb',
      },
      status: {
        active: '#2563eb',
        completed: '#10b981',
        deleted: '#dc2626',
      },
      ui: {
        border: '#e2e8f0',
        divider: '#cbd5e1',
      },
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  availableThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>('cosmic');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('selectedTheme');
      if (savedTheme && savedTheme in themes) {
        setThemeName(savedTheme as ThemeName);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const setTheme = async (name: ThemeName) => {
    try {
      await AsyncStorage.setItem('selectedTheme', name);
      setThemeName(name);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const value = {
    theme: themes[themeName],
    themeName,
    setTheme,
    availableThemes: themes,
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