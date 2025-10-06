import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface DateInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  style?: any;
  defaultToCurrentYear?: boolean;
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'MM/DD/YYYY',
  style,
  defaultToCurrentYear = true
}: DateInputProps) {
  const colors = useThemeColors();
  const [monthInput, setMonthInput] = useState('');
  const [dayInput, setDayInput] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [hoveredDate, setHoveredDate] = useState<number | null>(null);

  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  // Parse value prop into inputs
  useEffect(() => {
    if (value) {
      setMonthInput(String(value.getMonth() + 1).padStart(2, '0'));
      setDayInput(String(value.getDate()).padStart(2, '0'));
      setYearInput(String(value.getFullYear()));
      setPickerMonth(value.getMonth());
      setPickerYear(value.getFullYear());
    } else {
      setMonthInput('');
      setDayInput('');
      setYearInput('');
      if (defaultToCurrentYear) {
        const now = new Date();
        setPickerMonth(now.getMonth());
        setPickerYear(now.getFullYear());
      }
    }
  }, [value, defaultToCurrentYear]);

  // Update picker when inputs change
  useEffect(() => {
    const month = parseInt(monthInput, 10);
    const year = parseInt(yearInput, 10);

    if (month >= 1 && month <= 12) {
      setPickerMonth(month - 1);
    }

    if (year >= 1900 && year <= 2100) {
      setPickerYear(year);
    }
  }, [monthInput, yearInput]);

  const validateAndEmit = (month: string, day: string, year: string) => {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      const date = new Date(y, m - 1, d);
      if (date.getMonth() === m - 1 && date.getDate() === d) {
        onChange(date);
        return true;
      }
    } else if (!month && !day && !year) {
      onChange(undefined);
      return true;
    }
    return false;
  };

  const handleMonthChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2);
    setMonthInput(cleaned);

    if (cleaned.length === 2) {
      dayRef.current?.focus();
    }

    validateAndEmit(cleaned, dayInput, yearInput);
  };

  const handleDayChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 2);
    setDayInput(cleaned);

    if (cleaned.length === 2) {
      yearRef.current?.focus();
    }

    validateAndEmit(monthInput, cleaned, yearInput);
  };

  const handleYearChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    setYearInput(cleaned);
    validateAndEmit(monthInput, dayInput, cleaned);
  };

  const handleDateClick = (day: number) => {
    const month = String(pickerMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const year = String(pickerYear);

    setMonthInput(month);
    setDayInput(dayStr);
    setYearInput(year);
    validateAndEmit(month, dayStr, year);
  };

  const previousMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear(pickerYear - 1);
    } else {
      setPickerMonth(pickerMonth - 1);
    }
  };

  const nextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear(pickerYear + 1);
    } else {
      setPickerMonth(pickerMonth + 1);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isSelectedDate = (day: number) => {
    if (!monthInput || !dayInput || !yearInput) return false;
    return (
      parseInt(monthInput, 10) === pickerMonth + 1 &&
      parseInt(dayInput, 10) === day &&
      parseInt(yearInput, 10) === pickerYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === pickerMonth &&
      today.getFullYear() === pickerYear
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(pickerMonth, pickerYear);
    const firstDay = getFirstDayOfMonth(pickerMonth, pickerYear);
    const days = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelectedDate(day);
      const today = isToday(day);

      days.push(
        <TouchableOpacity
          key={day}
          onPress={() => handleDateClick(day)}
          style={[
            styles.dayButton,
            selected && { backgroundColor: colors.cosmic.purple, borderColor: colors.cosmic.purple },
            today && !selected && { backgroundColor: colors.cosmic.cyan + '20', borderColor: colors.cosmic.cyan },
          ]}
        >
          <Text style={[
            styles.dayText,
            { color: colors.text.primary },
            selected && styles.selectedDayText,
            today && !selected && { color: colors.cosmic.cyan, fontWeight: '600' },
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const clearDate = () => {
    setMonthInput('');
    setDayInput('');
    setYearInput('');
    onChange(undefined);
    const now = new Date();
    setPickerMonth(now.getMonth());
    setPickerYear(now.getFullYear());
  };

  const setToday = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = String(today.getFullYear());

    setMonthInput(month);
    setDayInput(day);
    setYearInput(year);
    setPickerMonth(today.getMonth());
    setPickerYear(today.getFullYear());
    validateAndEmit(month, day, year);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.ui.input,
          borderColor: colors.ui.border,
        }
      ]}>
        <TextInput
          ref={monthRef}
          style={[styles.input, { color: colors.text.primary }]}
          value={monthInput}
          onChangeText={handleMonthChange}
          placeholder="MM"
          placeholderTextColor={colors.text.secondary}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={[styles.separator, { color: colors.text.secondary }]}>/</Text>
        <TextInput
          ref={dayRef}
          style={[styles.input, { color: colors.text.primary }]}
          value={dayInput}
          onChangeText={handleDayChange}
          placeholder="DD"
          placeholderTextColor={colors.text.secondary}
          keyboardType="number-pad"
          maxLength={2}
        />
        <Text style={[styles.separator, { color: colors.text.secondary }]}>/</Text>
        <TextInput
          ref={yearRef}
          style={[styles.yearInput, { color: colors.text.primary }]}
          value={yearInput}
          onChangeText={handleYearChange}
          placeholder="YYYY"
          placeholderTextColor={colors.text.secondary}
          keyboardType="number-pad"
          maxLength={4}
        />

        {(monthInput || dayInput || yearInput) && (
          <TouchableOpacity onPress={clearDate} style={styles.clearButton}>
            <X color={colors.text.secondary} size={16} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.calendarButton}>
          <Calendar color={colors.text.secondary} size={20} />
        </TouchableOpacity>
      </View>

      {/* Calendar Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background.secondary }]} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <X color={colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Month/Year Navigation */}
            <View style={styles.navigation}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <ChevronLeft color={colors.text.primary} size={24} />
              </TouchableOpacity>

              <View style={styles.navCenter}>
                <Text style={[styles.navText, { color: colors.text.primary }]}>
                  {monthNames[pickerMonth]} {pickerYear}
                </Text>
              </View>

              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <ChevronRight color={colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <View key={idx} style={styles.weekDay}>
                  <Text style={[styles.weekDayText, { color: colors.text.secondary }]}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>

            {/* Quick Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={setToday}
                style={[styles.actionButton, { backgroundColor: colors.ui.border }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearDate}
                style={[styles.actionButton, { backgroundColor: colors.ui.border }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={[styles.actionButton, { backgroundColor: colors.cosmic.purple }]}
              >
                <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    width: 32,
    fontSize: 16,
    textAlign: 'center',
    padding: 0,
  },
  yearInput: {
    width: 48,
    fontSize: 16,
    textAlign: 'center',
    padding: 0,
  },
  separator: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  calendarButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginVertical: 2,
  },
  dayText: {
    fontSize: 16,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
