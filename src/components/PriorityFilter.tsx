import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Filter, Zap, Star, Cloud } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';

export type PriorityLevel = 'all' | 'SUPERNOVA' | 'STELLAR' | 'NEBULA';
export type SortOrder = 'priority-high' | 'priority-low' | 'date-new' | 'date-old';

interface PriorityFilterProps {
  onPriorityChange?: (priority: PriorityLevel) => void;
  onSortChange?: (sort: SortOrder) => void;
  currentPriority?: PriorityLevel;
  currentSort?: SortOrder;
}

const priorityOptions = [
  { value: 'all' as PriorityLevel, label: 'All Priorities', icon: Filter, color: '#9ca3af' },
  { value: 'SUPERNOVA' as PriorityLevel, label: 'Supernova', icon: Zap, color: '#f87171' },
  { value: 'STELLAR' as PriorityLevel, label: 'Stellar', icon: Star, color: '#facc15' },
  { value: 'NEBULA' as PriorityLevel, label: 'Nebula', icon: Cloud, color: '#86efac' },
];

const sortOptions = [
  { value: 'priority-high' as SortOrder, label: 'Highest Priority First' },
  { value: 'priority-low' as SortOrder, label: 'Lowest Priority First' },
  { value: 'date-new' as SortOrder, label: 'Newest First' },
  { value: 'date-old' as SortOrder, label: 'Oldest First' },
];

export default function PriorityFilter({
  onPriorityChange,
  onSortChange,
  currentPriority = 'all',
  currentSort = 'priority-high',
}: PriorityFilterProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const selectedPriority = priorityOptions.find(p => p.value === currentPriority) || priorityOptions[0];
  const selectedSort = sortOptions.find(s => s.value === currentSort) || sortOptions[0];

  return (
    <View style={styles.container}>
      {/* Priority Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowPriorityMenu(true)}
      >
        <View style={styles.buttonContent}>
          {React.createElement(selectedPriority.icon, {
            size: 16,
            color: selectedPriority.color,
          })}
          <Text style={styles.buttonText}>{selectedPriority.label}</Text>
          <ChevronDown size={16} color={colors.text.secondary} />
        </View>
      </TouchableOpacity>

      {/* Sort Order Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowSortMenu(true)}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>{selectedSort.label}</Text>
          <ChevronDown size={16} color={colors.text.secondary} />
        </View>
      </TouchableOpacity>

      {/* Priority Menu Modal */}
      <Modal
        visible={showPriorityMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPriorityMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPriorityMenu(false)}
        >
          <View style={styles.menuContainer}>
            {priorityOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.menuItem,
                  currentPriority === option.value && styles.menuItemActive,
                ]}
                onPress={() => {
                  onPriorityChange?.(option.value);
                  setShowPriorityMenu(false);
                }}
              >
                {React.createElement(option.icon, {
                  size: 16,
                  color: option.color,
                })}
                <Text style={styles.menuItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort Menu Modal */}
      <Modal
        visible={showSortMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.menuContainer}>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.menuItem,
                  currentSort === option.value && styles.menuItemActive,
                ]}
                onPress={() => {
                  onSortChange?.(option.value);
                  setShowSortMenu(false);
                }}
              >
                <Text style={styles.menuItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: colors.glass.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: colors.glass.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingVertical: 8,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemActive: {
    backgroundColor: colors.glass.hover,
  },
  menuItemText: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
  },
});