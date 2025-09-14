import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  User,
  Palette,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const themeIcons: Record<string, any> = {
  cosmic: Sparkles,
  nebula: Moon,
  stellar: Zap,
  aurora: Sun,
  quantum: Sparkles,
  daylight: Sun,
};

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, themeName, setTheme, availableThemes } = useTheme();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            // In production, navigate to auth screen
            Alert.alert('Logged out', 'You have been logged out successfully');
          },
        },
      ],
    );
  };

  const renderThemeOption = (themeKey: string) => {
    const themeOption = availableThemes[themeKey as keyof typeof availableThemes];
    const Icon = themeIcons[themeKey] || Sparkles;
    const isSelected = themeName === themeKey;

    return (
      <TouchableOpacity
        key={themeKey}
        onPress={() => setTheme(themeKey as any)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={
            isSelected
              ? [theme.colors.cosmic.purple + '20', theme.colors.cosmic.pink + '10']
              : [theme.colors.background.secondary, theme.colors.background.tertiary]
          }
          style={[
            styles.themeCard,
            {
              borderColor: isSelected ? theme.colors.cosmic.purple : theme.colors.ui.border + '30',
              borderWidth: isSelected ? 2 : 1,
            },
          ]}
        >
          <View style={[styles.themePreview, { backgroundColor: themeOption.colors.background.primary }]}>
            <View style={[styles.themeAccent, { backgroundColor: themeOption.colors.cosmic.purple }]} />
            <View style={[styles.themeAccent, { backgroundColor: themeOption.colors.cosmic.pink }]} />
            <View style={[styles.themeAccent, { backgroundColor: themeOption.colors.cosmic.cyan }]} />
          </View>
          <View style={styles.themeInfo}>
            <Icon size={16} color={theme.colors.text.secondary} />
            <Text style={[styles.themeName, { color: theme.colors.text.primary }]}>
              {themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: theme.colors.cosmic.purple }]}>
              <Check size={12} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <LinearGradient
          colors={[theme.colors.background.secondary, theme.colors.background.tertiary]}
          style={styles.profileSection}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.cosmic.purple }]}>
            <User size={32} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.colors.text.primary }]}>nmuthu@gmail.com</Text>
            <Text style={[styles.userRole, { color: theme.colors.text.secondary }]}>Developer Account</Text>
          </View>
        </LinearGradient>

        {/* Theme Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[theme.colors.cosmic.purple, theme.colors.cosmic.pink]}
              style={styles.sectionIcon}
            >
              <Palette size={16} color="#fff" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Appearance</Text>
          </View>

          <View style={styles.themeGrid}>
            {Object.keys(availableThemes).map(renderThemeOption)}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary, marginBottom: 12 }]}>
            Preferences
          </Text>

          <TouchableOpacity activeOpacity={0.7}>
            <LinearGradient
              colors={[theme.colors.background.secondary, theme.colors.background.tertiary]}
              style={styles.preferenceCard}
            >
              <View style={[styles.preferenceIcon, { backgroundColor: theme.colors.cosmic.cyan + '20' }]}>
                <Bell size={18} color={theme.colors.cosmic.cyan} />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={[styles.preferenceTitle, { color: theme.colors.text.primary }]}>
                  Notifications
                </Text>
                <Text style={[styles.preferenceDescription, { color: theme.colors.text.muted }]}>
                  Manage push notifications
                </Text>
              </View>
              <ChevronRight size={18} color={theme.colors.text.muted} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={[theme.colors.background.secondary, theme.colors.background.tertiary]}
              style={styles.preferenceCard}
            >
              <View style={[styles.preferenceIcon, { backgroundColor: theme.colors.cosmic.purple + '20' }]}>
                <Shield size={18} color={theme.colors.cosmic.purple} />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={[styles.preferenceTitle, { color: theme.colors.text.primary }]}>
                  Privacy & Security
                </Text>
                <Text style={[styles.preferenceDescription, { color: theme.colors.text.muted }]}>
                  Manage your data
                </Text>
              </View>
              <ChevronRight size={18} color={theme.colors.text.muted} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <LinearGradient
            colors={[theme.colors.priority.supernova + '10', theme.colors.priority.supernova + '20']}
            style={styles.logoutButton}
          >
            <LogOut size={18} color={theme.colors.priority.supernova} />
            <Text style={[styles.logoutText, { color: theme.colors.priority.supernova }]}>
              Logout
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.colors.text.muted }]}>
          Version 1.0.0 • Cosmic Space Mobile
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeCard: {
    width: 104,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  themePreview: {
    width: 80,
    height: 50,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    padding: 8,
    gap: 4,
  },
  themeAccent: {
    flex: 1,
    borderRadius: 4,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  preferenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceContent: {
    flex: 1,
    marginLeft: 12,
  },
  preferenceTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});