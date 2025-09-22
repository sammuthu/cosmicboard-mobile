import { ThemeTemplate } from '../contexts/ThemeContext';

// Default themes that match the database
export const DEFAULT_THEMES: ThemeTemplate[] = [
  {
    id: 'moon',
    name: 'moon',
    displayName: 'Moon',
    description: 'Dark blue theme with cool tones',
    isDefault: true,
    colors: {
      parentBackground: {
        from: '#1e293b',
        via: '#1e3a8a',
        to: '#312e81',
      },
      prismCard: {
        background: {
          from: 'rgba(17, 24, 39, 0.9)',
          via: 'rgba(31, 41, 55, 0.9)',
          to: 'rgba(17, 24, 39, 0.9)',
        },
        glowGradient: {
          from: '#a855f7',
          via: '#ec4899',
          to: '#eab308',
        },
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      text: {
        primary: '#f1f5f9',
        secondary: '#cbd5e1',
        accent: '#60a5fa',
        muted: '#94a3b8',
      },
      buttons: {
        primary: {
          background: '#3b82f6',
          hover: '#2563eb',
          text: '#ffffff',
        },
        secondary: {
          background: 'rgba(59, 130, 246, 0.2)',
          hover: 'rgba(59, 130, 246, 0.3)',
          text: '#60a5fa',
        },
      },
      status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
  },
  {
    id: 'sun',
    name: 'sun',
    displayName: 'Sun',
    description: 'Warm orange and amber tones',
    isDefault: false,
    colors: {
      parentBackground: {
        from: '#7c2d12',
        via: '#78350f',
        to: '#713f12',
      },
      prismCard: {
        background: {
          from: 'rgba(17, 24, 39, 0.9)',
          via: 'rgba(31, 41, 55, 0.9)',
          to: 'rgba(17, 24, 39, 0.9)',
        },
        glowGradient: {
          from: '#f97316',
          via: '#fbbf24',
          to: '#facc15',
        },
        borderColor: 'rgba(251, 191, 36, 0.2)',
      },
      text: {
        primary: '#fef3c7',
        secondary: '#fde68a',
        accent: '#fbbf24',
        muted: '#fcd34d',
      },
      buttons: {
        primary: {
          background: '#f59e0b',
          hover: '#d97706',
          text: '#ffffff',
        },
        secondary: {
          background: 'rgba(245, 158, 11, 0.2)',
          hover: 'rgba(245, 158, 11, 0.3)',
          text: '#fbbf24',
        },
      },
      status: {
        success: '#84cc16',
        warning: '#f59e0b',
        error: '#dc2626',
        info: '#0891b2',
      },
    },
  },
  {
    id: 'daylight',
    name: 'daylight',
    displayName: 'Daylight',
    description: 'Bright and light theme with warm tones',
    isDefault: false,
    colors: {
      parentBackground: {
        from: '#fffbeb',
        via: '#fff7ed',
        to: '#fefce8',
      },
      prismCard: {
        background: {
          from: 'rgba(255, 255, 255, 0.9)',
          via: 'rgba(254, 249, 195, 0.9)',
          to: 'rgba(255, 255, 255, 0.9)',
        },
        glowGradient: {
          from: '#fbbf24',
          via: '#fb923c',
          to: '#facc15',
        },
        borderColor: 'rgba(251, 191, 36, 0.3)',
      },
      text: {
        primary: '#292524',
        secondary: '#57534e',
        accent: '#ea580c',
        muted: '#78716c',
      },
      buttons: {
        primary: {
          background: '#f97316',
          hover: '#ea580c',
          text: '#ffffff',
        },
        secondary: {
          background: 'rgba(249, 115, 22, 0.1)',
          hover: 'rgba(249, 115, 22, 0.2)',
          text: '#ea580c',
        },
      },
      status: {
        success: '#65a30d',
        warning: '#d97706',
        error: '#dc2626',
        info: '#0284c7',
      },
    },
  },
];