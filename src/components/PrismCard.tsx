import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';

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

  const content = (
    <Animated.View
      style={[
        styles.container,
        style,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>{children}</View>
      </LinearGradient>
      
      {/* Prism effect border */}
      <View style={styles.borderTop} />
      <View style={styles.borderRight} />
      <View style={styles.borderBottom} />
      <View style={styles.borderLeft} />
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

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: colors.background.card,
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
  borderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cosmic.purple,
    opacity: 0.3,
  },
  borderRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.cosmic.pink,
    opacity: 0.3,
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cosmic.blue,
    opacity: 0.3,
  },
  borderLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.cosmic.cyan,
    opacity: 0.3,
  },
});