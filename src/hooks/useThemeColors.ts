import { useTheme } from '../contexts/ThemeContext';
import { colors as defaultColors } from '../styles/colors';

export function useThemeColors() {
  const { colors: themeColors } = useTheme();

  // Return theme colors if available, otherwise fall back to default colors
  return themeColors || defaultColors;
}