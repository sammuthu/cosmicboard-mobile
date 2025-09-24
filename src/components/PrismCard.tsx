import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../hooks/useThemeColors';
import { useTheme } from '../contexts/ThemeContext';

interface PrismCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function PrismCard({
  children,
  onPress,
  style,
  disabled = false
}: PrismCardProps) {
  const colors = useThemeColors();
  const { colors: themeColors } = useTheme();
  const styles = createStyles(colors);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Use theme colors for gradient if available, otherwise fall back to defaults
  const gradientColors = themeColors ? [
    themeColors.prismCard.background.from,
    themeColors.prismCard.background.via,
    themeColors.prismCard.background.to
  ] : ['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)', 'rgba(236, 72, 153, 0.05)'];

  const borderColor = themeColors?.prismCard.borderColor || colors.ui.border;

  const content = (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: scaleAnim }],
          borderColor: borderColor,
          borderWidth: 1
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});