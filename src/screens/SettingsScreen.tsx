import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeTemplate } from '../types/theme';
import { useThemeColors } from '../hooks/useThemeColors';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { activeTheme, templates, loading, setTheme } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    if (activeTheme) {
      setSelectedTheme(activeTheme.themeId);
    }
  }, [activeTheme]);

  const handleThemeSelect = async (themeId: string) => {
    try {
      setSelectedTheme(themeId);
      await setTheme(themeId, isGlobal);
      Alert.alert('Success', 'Theme updated successfully');
    } catch (error) {
      console.error('Failed to set theme:', error);
      Alert.alert('Error', 'Failed to update theme');
      // Revert selection on error
      setSelectedTheme(activeTheme?.themeId || null);
    }
  };

  const handleCustomizeTheme = (template: ThemeTemplate) => {
    navigation.navigate('ThemeCustomization', { template });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme Settings</Text>

        {activeTheme && (
          <View style={styles.currentTheme}>
            <Text style={styles.label}>Current Theme:</Text>
            <Text style={styles.value}>{activeTheme.displayName}</Text>
          </View>
        )}

        <View style={styles.globalSetting}>
          <Text style={styles.label}>Apply globally across all devices</Text>
          <Switch
            value={isGlobal}
            onValueChange={setIsGlobal}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isGlobal ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <Text style={styles.subsectionTitle}>Available Themes</Text>

        <View style={styles.themesGrid}>
          {templates.map((template: ThemeTemplate) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.themeCard,
                selectedTheme === template.id && styles.selectedCard
              ]}
              onPress={() => handleThemeSelect(template.id)}
            >
              <LinearGradient
                colors={[
                  template.colors.parentBackground.from,
                  template.colors.parentBackground.via,
                  template.colors.parentBackground.to
                ]}
                style={styles.themePreview}
              >
                <View style={[
                  styles.previewCard,
                  {
                    backgroundColor: template.colors.prismCard.background.from,
                    borderColor: template.colors.prismCard.borderColor
                  }
                ]}>
                  <View style={styles.previewContent}>
                    <View style={[
                      styles.previewDot,
                      { backgroundColor: template.colors.text.primary }
                    ]} />
                    <View style={[
                      styles.previewLine,
                      { backgroundColor: template.colors.text.secondary }
                    ]} />
                  </View>
                </View>
              </LinearGradient>

              <View style={styles.themeFooter}>
                <Text style={styles.themeName}>{template.displayName}</Text>
                <TouchableOpacity
                  style={styles.customizeButton}
                  onPress={() => handleCustomizeTheme(template)}
                >
                  <Text style={styles.customizeButtonText}>Customize</Text>
                </TouchableOpacity>
              </View>

              {selectedTheme === template.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 15,
  },
  currentTheme: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    color: colors.text.secondary,
    marginRight: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  globalSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    marginBottom: 10,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  themeCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 15,
  },
  selectedCard: {
    borderColor: colors.cosmic.purple,
    borderWidth: 2,
    borderRadius: 12,
  },
  themePreview: {
    height: 120,
    borderRadius: 10,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCard: {
    width: '80%',
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'center',
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  previewLine: {
    height: 2,
    flex: 1,
    borderRadius: 1,
  },
  themeFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  themeName: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  customizeButton: {
    marginTop: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.background.secondary,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  customizeButtonText: {
    fontSize: 12,
    color: colors.text.accent,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
});