import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { ThemeColors, ThemeTemplate } from '../types/theme';

interface RouteParams {
  template: ThemeTemplate;
}

export default function ThemeCustomizationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { template } = route.params as RouteParams;
  const { customizeTheme } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const [customColors, setCustomColors] = useState<ThemeColors>(template.colors);
  const [activeTab, setActiveTab] = useState<'background' | 'cards' | 'text' | 'buttons' | 'status'>('background');
  const [saving, setSaving] = useState(false);

  const updateColor = (path: string[], value: string) => {
    setCustomColors(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      let current = updated;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return updated;
    });
  };

  const validateHexColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const handleColorChange = (path: string[], value: string) => {
    // Allow typing even if not valid yet
    updateColor(path, value);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customizeTheme(template.id, customColors);
      Alert.alert('Success', 'Theme customization saved and applied!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme customization');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Customization',
      'Are you sure you want to reset all customizations?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => setCustomColors(template.colors)
        }
      ]
    );
  };

  const renderColorInput = (label: string, value: string, path: string[]) => (
    <View style={styles.colorInputRow}>
      <Text style={styles.colorLabel}>{label}</Text>
      <View style={styles.colorInputContainer}>
        <View style={[styles.colorPreview, { backgroundColor: value }]} />
        <TextInput
          style={styles.colorInput}
          value={value}
          onChangeText={(text) => handleColorChange(path, text)}
          placeholder="#000000"
          placeholderTextColor={colors.text.muted}
          maxLength={7}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderBackgroundTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Parent Background Gradient</Text>
      {renderColorInput('From', customColors.parentBackground.from, ['parentBackground', 'from'])}
      {renderColorInput('Via', customColors.parentBackground.via, ['parentBackground', 'via'])}
      {renderColorInput('To', customColors.parentBackground.to, ['parentBackground', 'to'])}
    </View>
  );

  const renderCardsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Card Background</Text>
      {renderColorInput('From', customColors.prismCard.background.from, ['prismCard', 'background', 'from'])}
      {renderColorInput('Via', customColors.prismCard.background.via, ['prismCard', 'background', 'via'])}
      {renderColorInput('To', customColors.prismCard.background.to, ['prismCard', 'background', 'to'])}

      <Text style={styles.sectionTitle}>Card Glow</Text>
      {renderColorInput('From', customColors.prismCard.glowGradient.from, ['prismCard', 'glowGradient', 'from'])}
      {renderColorInput('Via', customColors.prismCard.glowGradient.via, ['prismCard', 'glowGradient', 'via'])}
      {renderColorInput('To', customColors.prismCard.glowGradient.to, ['prismCard', 'glowGradient', 'to'])}

      <Text style={styles.sectionTitle}>Card Border</Text>
      {renderColorInput('Border', customColors.prismCard.borderColor, ['prismCard', 'borderColor'])}
    </View>
  );

  const renderTextTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Text Colors</Text>
      {renderColorInput('Primary', customColors.text.primary, ['text', 'primary'])}
      {renderColorInput('Secondary', customColors.text.secondary, ['text', 'secondary'])}
      {renderColorInput('Accent', customColors.text.accent, ['text', 'accent'])}
      {renderColorInput('Muted', customColors.text.muted, ['text', 'muted'])}
    </View>
  );

  const renderButtonsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Primary Button</Text>
      {renderColorInput('Background', customColors.buttons.primary.background, ['buttons', 'primary', 'background'])}
      {renderColorInput('Hover', customColors.buttons.primary.hover, ['buttons', 'primary', 'hover'])}
      {renderColorInput('Text', customColors.buttons.primary.text, ['buttons', 'primary', 'text'])}

      <Text style={styles.sectionTitle}>Secondary Button</Text>
      {renderColorInput('Background', customColors.buttons.secondary.background, ['buttons', 'secondary', 'background'])}
      {renderColorInput('Hover', customColors.buttons.secondary.hover, ['buttons', 'secondary', 'hover'])}
      {renderColorInput('Text', customColors.buttons.secondary.text, ['buttons', 'secondary', 'text'])}
    </View>
  );

  const renderStatusTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Status Colors</Text>
      {renderColorInput('Success', customColors.status.success, ['status', 'success'])}
      {renderColorInput('Warning', customColors.status.warning, ['status', 'warning'])}
      {renderColorInput('Error', customColors.status.error, ['status', 'error'])}
      {renderColorInput('Info', customColors.status.info, ['status', 'info'])}
    </View>
  );

  const renderPreview = () => (
    <View style={styles.previewSection}>
      <Text style={styles.previewTitle}>Live Preview</Text>

      <LinearGradient
        colors={[
          customColors.parentBackground.from,
          customColors.parentBackground.via,
          customColors.parentBackground.to
        ]}
        style={styles.previewContainer}
      >
        <LinearGradient
          colors={[
            customColors.prismCard.background.from,
            customColors.prismCard.background.via,
            customColors.prismCard.background.to
          ]}
          style={[
            styles.previewCard,
            { borderColor: customColors.prismCard.borderColor }
          ]}
        >
          <Text style={[styles.previewCardTitle, { color: customColors.text.primary }]}>
            Preview Card
          </Text>
          <Text style={[styles.previewCardText, { color: customColors.text.secondary }]}>
            This is how your theme will look with the current color settings.
          </Text>
          <Text style={[styles.previewAccent, { color: customColors.text.accent }]}>
            Accent text appears like this
          </Text>
          <Text style={[styles.previewMuted, { color: customColors.text.muted }]}>
            Muted text for less important content
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.previewButton,
                { backgroundColor: customColors.buttons.primary.background }
              ]}
            >
              <Text style={{ color: customColors.buttons.primary.text }}>
                Primary Button
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.previewButton,
                { backgroundColor: customColors.buttons.secondary.background }
              ]}
            >
              <Text style={{ color: customColors.buttons.secondary.text }}>
                Secondary
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: customColors.status.success }]}>
              <Text style={styles.statusText}>Success</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: customColors.status.warning }]}>
              <Text style={styles.statusText}>Warning</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: customColors.status.error }]}>
              <Text style={styles.statusText}>Error</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: customColors.status.info }]}>
              <Text style={styles.statusText}>Info</Text>
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </View>
  );

  if (saving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text.primary} />
        <Text style={styles.loadingText}>Saving customization...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customize {template.displayName}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'background' && styles.activeTab]}
            onPress={() => setActiveTab('background')}
          >
            <Text style={[styles.tabText, activeTab === 'background' && styles.activeTabText]}>
              Background
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'cards' && styles.activeTab]}
            onPress={() => setActiveTab('cards')}
          >
            <Text style={[styles.tabText, activeTab === 'cards' && styles.activeTabText]}>
              Cards
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'text' && styles.activeTab]}
            onPress={() => setActiveTab('text')}
          >
            <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>
              Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'buttons' && styles.activeTab]}
            onPress={() => setActiveTab('buttons')}
          >
            <Text style={[styles.tabText, activeTab === 'buttons' && styles.activeTabText]}>
              Buttons
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'status' && styles.activeTab]}
            onPress={() => setActiveTab('status')}
          >
            <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText]}>
              Status
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editorContainer}>
          {activeTab === 'background' && renderBackgroundTab()}
          {activeTab === 'cards' && renderCardsTab()}
          {activeTab === 'text' && renderTextTab()}
          {activeTab === 'buttons' && renderButtonsTab()}
          {activeTab === 'status' && renderStatusTab()}
        </View>

        {renderPreview()}
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save and Apply</Text>
      </TouchableOpacity>
    </View>
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
  loadingText: {
    marginTop: 10,
    color: colors.text.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  resetButton: {
    padding: 10,
  },
  resetButtonText: {
    color: colors.text.accent,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.cosmic.purple,
  },
  tabText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  activeTabText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  editorContainer: {
    padding: 20,
  },
  tabContent: {
    gap: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
    marginTop: 10,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorLabel: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: 14,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  colorInput: {
    width: 100,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 5,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
  },
  previewSection: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 15,
  },
  previewContainer: {
    padding: 20,
    borderRadius: 10,
    minHeight: 300,
  },
  previewCard: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewCardText: {
    fontSize: 14,
    marginBottom: 10,
  },
  previewAccent: {
    fontSize: 14,
    marginBottom: 5,
  },
  previewMuted: {
    fontSize: 12,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 15,
  },
  previewButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
  },
  saveButton: {
    backgroundColor: colors.cosmic.purple,
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});