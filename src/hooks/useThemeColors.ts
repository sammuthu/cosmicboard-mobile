import { useTheme } from '../contexts/ThemeContext';
import { colors as defaultColors } from '../styles/colors';

export function useThemeColors() {
  const { colors: themeColors } = useTheme();

  // Return theme colors if available, otherwise return default colors
  // This ensures we always have colors available even during loading
  if (themeColors) {
    // Map theme colors to the app's color structure
    return {
      background: {
        primary: themeColors.parentBackground.from,
        secondary: themeColors.prismCard.background.from,
        tertiary: themeColors.prismCard.background.via,
      },
      text: {
        primary: themeColors.text.primary,
        secondary: themeColors.text.secondary,
        accent: themeColors.text.accent,
        muted: themeColors.text.muted,
      },
      primary: {
        main: themeColors.buttons.primary.background,
        hover: themeColors.buttons.primary.hover,
        text: themeColors.buttons.primary.text,
      },
      secondary: {
        main: themeColors.buttons.secondary.background,
        hover: themeColors.buttons.secondary.hover,
        text: themeColors.buttons.secondary.text,
      },
      cosmic: {
        purple: themeColors.text.accent || '#8B5CF6',
        purpleLight: themeColors.prismCard.glowGradient.from || '#A78BFA',
        blue: themeColors.status.info || '#3B82F6',
        cyan: themeColors.prismCard.glowGradient.via || '#06B6D4',
      },
      status: {
        success: themeColors.status.success,
        warning: themeColors.status.warning,
        error: themeColors.status.error,
        info: themeColors.status.info,
      },
      ui: {
        border: themeColors.prismCard.borderColor,
        divider: themeColors.prismCard.borderColor,
        backdrop: 'rgba(0, 0, 0, 0.5)',
      },
      priorities: {
        supernova: themeColors.status.error || '#DC2626',
        stellar: themeColors.status.warning || '#F59E0B',
        nebula: themeColors.status.info || '#3B82F6',
      },
    };
  }

  // Return default colors as fallback
  return defaultColors;
}