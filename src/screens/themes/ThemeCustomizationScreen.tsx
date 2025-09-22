import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Save, RotateCcw, ChevronLeft, Palette } from 'lucide-react-native';
import { useTheme, ThemeTemplate, ThemeColors } from '../../contexts/ThemeContext';
import apiService from '../../services/api';
import { deepMerge } from '../../utils/deepMerge';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ThemeCustomization'>;
type RoutePropType = RouteProp<RootStackParamList, 'ThemeCustomization'>;

// Pre-defined color palettes for quick selection (mobile-friendly)
const COLOR_PALETTES = {
  purple: ['#8b5cf6', '#7c3aed', '#9333ea', '#a855f7', '#c084fc'],
  blue: ['#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd'],
  green: ['#10b981', '#059669', '#047857', '#34d399', '#6ee7b7'],
  pink: ['#ec4899', '#db2777', '#be185d', '#f9a8d4', '#fbcfe8'],
  orange: ['#f59e0b', '#ea580c', '#dc2626', '#fbbf24', '#fed7aa'],
  cyan: ['#06b6d4', '#0891b2', '#0e7490', '#22d3ee', '#67e8f9'],
};

// Sections for organization
const COLOR_SECTIONS = [
  { id: 'background', title: 'Background', icon: '🎨' },
  { id: 'text', title: 'Text', icon: '✏️' },
  { id: 'buttons', title: 'Buttons', icon: '🔘' },
  { id: 'status', title: 'Status', icon: '🚦' },
];

export default function ThemeCustomizationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { theme, refreshTheme } = useTheme();
  const themeTemplate = route.params?.theme;

  const [customColors, setCustomColors] = useState<Partial<ThemeColors>>({});
  const [activeSection, setActiveSection] = useState('background');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadExistingCustomization();
  }, [themeTemplate]);

  const loadExistingCustomization = async () => {
    try {
      const customizations = await apiService.getUserThemeCustomizations();
      const existing = customizations?.find((c: any) => c.themeId === themeTemplate.id);
      if (existing) {
        setCustomColors(existing.customColors || {});
      }
    } catch (error) {
      console.error('Failed to load customizations:', error);
    }
  };

  const handleColorChange = (path: string, color: string) => {
    const keys = path.split('.');
    const newColors = { ...customColors };

    let current: any = newColors;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = color;

    setCustomColors(newColors);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.saveThemeCustomization(themeTemplate.id, customColors);
      await refreshTheme();
      Alert.alert('Success', 'Theme customization saved successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save customization:', error);
      Alert.alert('Error', 'Failed to save theme customization');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Theme',
      'This will remove all customizations for this theme. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              const customizations = await apiService.getUserThemeCustomizations();
              const existing = customizations?.find((c: any) => c.themeId === themeTemplate.id);
              if (existing) {
                await apiService.deleteThemeCustomization(existing.id);
              }
              setCustomColors({});
              await refreshTheme();
              navigation.goBack();
            } catch (error) {
              console.error('Failed to reset theme:', error);
              Alert.alert('Error', 'Failed to reset theme');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };

  const getMergedColors = () => {
    return deepMerge(themeTemplate.colors, customColors);
  };

  const renderColorPicker = (label: string, path: string, currentValue: string) => {
    return (
      <View style={styles.colorField}>
        <Text style={[styles.colorLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
        <View style={styles.colorInputRow}>
          <TextInput
            style={[
              styles.colorInput,
              {
                backgroundColor: theme.colors.background.elevated,
                color: theme.colors.text.primary,
                borderColor: theme.colors.ui.border,
              },
            ]}
            value={currentValue}
            onChangeText={(color) => handleColorChange(path, color)}
            placeholder="#000000"
            placeholderTextColor={theme.colors.text.muted}
          />
          <View
            style={[
              styles.colorPreview,
              { backgroundColor: currentValue, borderColor: theme.colors.ui.border },
            ]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paletteRow}>
          {COLOR_PALETTES[
            label.toLowerCase().includes('primary') ? 'purple' :
            label.toLowerCase().includes('success') ? 'green' :
            label.toLowerCase().includes('warning') ? 'orange' :
            label.toLowerCase().includes('error') ? 'pink' :
            label.toLowerCase().includes('info') ? 'blue' : 'purple'
          ].map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => handleColorChange(path, color)}
              style={[styles.paletteSwatch, { backgroundColor: color }]}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSection = () => {
    const mergedColors = getMergedColors();

    switch (activeSection) {
      case 'background':
        return (
          <>
            {renderColorPicker('Background From', 'parentBackground.from', mergedColors.parentBackground.from)}
            {renderColorPicker('Background Via', 'parentBackground.via', mergedColors.parentBackground.via)}
            {renderColorPicker('Background To', 'parentBackground.to', mergedColors.parentBackground.to)}
            {renderColorPicker('Card Background', 'prismCard.background.from', mergedColors.prismCard.background.from)}
            {renderColorPicker('Border Color', 'prismCard.borderColor', mergedColors.prismCard.borderColor)}
          </>
        );
      case 'text':
        return (
          <>
            {renderColorPicker('Primary Text', 'text.primary', mergedColors.text.primary)}
            {renderColorPicker('Secondary Text', 'text.secondary', mergedColors.text.secondary)}
            {renderColorPicker('Accent Text', 'text.accent', mergedColors.text.accent)}
            {renderColorPicker('Muted Text', 'text.muted', mergedColors.text.muted)}
          </>
        );
      case 'buttons':
        return (
          <>
            {renderColorPicker('Primary Button', 'buttons.primary.background', mergedColors.buttons.primary.background)}
            {renderColorPicker('Primary Hover', 'buttons.primary.hover', mergedColors.buttons.primary.hover)}
            {renderColorPicker('Button Text', 'buttons.primary.text', mergedColors.buttons.primary.text)}
            {renderColorPicker('Secondary Button', 'buttons.secondary.background', mergedColors.buttons.secondary.background)}
          </>
        );
      case 'status':
        return (
          <>
            {renderColorPicker('Success', 'status.success', mergedColors.status.success)}
            {renderColorPicker('Warning', 'status.warning', mergedColors.status.warning)}
            {renderColorPicker('Error', 'status.error', mergedColors.status.error)}
            {renderColorPicker('Info', 'status.info', mergedColors.status.info)}
          </>
        );
      default:
        return null;
    }
  };

  const mergedColors = getMergedColors();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      {/* Preview Header */}
      <LinearGradient
        colors={[mergedColors.parentBackground.from, mergedColors.parentBackground.via, mergedColors.parentBackground.to]}
        style={styles.previewHeader}
      >
        <View style={styles.previewContent}>
          <Text style={[styles.previewTitle, { color: mergedColors.text.primary }]}>
            {themeTemplate.displayName}
          </Text>
          <Text style={[styles.previewDescription, { color: mergedColors.text.secondary }]}>
            Customize your theme colors
          </Text>
        </View>
      </LinearGradient>

      {/* Section Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionTabs}>
        {COLOR_SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.sectionTab,
              activeSection === section.id && [styles.sectionTabActive, { borderBottomColor: theme.colors.cosmic.purple }],
            ]}
            onPress={() => setActiveSection(section.id)}
          >
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSection === section.id ? theme.colors.text.primary : theme.colors.text.muted },
              ]}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Color Fields */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSection()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background.secondary, borderTopColor: theme.colors.ui.border }]}>
        <TouchableOpacity
          style={[styles.resetButton, { borderColor: theme.colors.status.deleted }]}
          onPress={handleReset}
          disabled={resetting}
        >
          {resetting ? (
            <ActivityIndicator size="small" color={theme.colors.status.deleted} />
          ) : (
            <>
              <RotateCcw size={18} color={theme.colors.status.deleted} />
              <Text style={[styles.resetButtonText, { color: theme.colors.status.deleted }]}>Reset</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.cosmic.purple }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Save size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewHeader: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  previewContent: {
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
  },
  sectionTabs: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sectionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  sectionTabActive: {
    borderBottomWidth: 3,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  colorField: {
    marginBottom: 24,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  colorInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  colorInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  colorPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  paletteRow: {
    flexDirection: 'row',
  },
  paletteSwatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});