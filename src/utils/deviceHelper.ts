import { Dimensions, Platform } from 'react-native';
import * as Device from 'expo-device';

export type DeviceType = 'mobile' | 'tablet';

export function getDeviceType(): DeviceType {
  const { width, height } = Dimensions.get('window');
  const screenSize = Math.max(width, height);

  // Check if it's a tablet based on screen size and device type
  if (Device.deviceType === Device.DeviceType.TABLET) {
    return 'tablet';
  }

  // For iOS, check if it's an iPad
  if (Platform.OS === 'ios' && (
    Platform.isPad ||
    Device.modelName?.includes('iPad') ||
    screenSize >= 768
  )) {
    return 'tablet';
  }

  // For Android, use screen size heuristic
  if (Platform.OS === 'android' && screenSize >= 768) {
    return 'tablet';
  }

  return 'mobile';
}