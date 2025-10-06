import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import { colors as defaultColors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import DateInput from '../components/DateInput';
import apiService from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'TaskDetail'>;
type RouteParams = { params: { taskId: string; projectId: string } };

export default function TaskDetailScreen() {
  const route = useRoute() as RouteParams;
  const navigation = useNavigation<NavigationProp>();
  const themeColors = useThemeColors();
  const colors = themeColors || defaultColors;
  const { taskId, projectId } = route.params;

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'SUPERNOVA' | 'STELLAR' | 'NEBULA'>('STELLAR');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [tags, setTags] = useState('');

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const taskData = await apiService.getTask(projectId, taskId);
      setTask(taskData);
      setTitle(taskData.title || '');
      setContent(taskData.content || '');
      setPriority(taskData.priority || 'STELLAR');
      setDueDate(taskData.dueDate ? new Date(taskData.dueDate) : undefined);
      setTags(taskData.tags?.join(', ') || '');
    } catch (error) {
      console.error('Failed to load task:', error);
      Alert.alert('Error', 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const tagArray = tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      await apiService.updateTask(projectId, taskId, {
        title,
        content,
        priority,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        tags: tagArray,
      });

      Alert.alert('Success', 'Task updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteTask(projectId, taskId);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.text.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
            <Trash2 color={colors.status.deleted} size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.iconButton}>
            <Save color={colors.cosmic.purple} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <PrismCard>
          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor={colors.text.secondary}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Task description"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={6}
          />

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {(['SUPERNOVA', 'STELLAR', 'NEBULA'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && styles.priorityButtonActive
                ]}
                onPress={() => setPriority(p)}
              >
                <Text style={[
                  styles.priorityText,
                  priority === p && styles.priorityTextActive
                ]}>
                  {p === 'SUPERNOVA' ? '🌟 SuperNova' : p === 'STELLAR' ? '⭐ Stellar' : '☁️ Nebula'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Due Date */}
          <Text style={styles.label}>Due Date</Text>
          <DateInput
            value={dueDate}
            onChange={setDueDate}
            placeholder="MM/DD/YYYY"
          />

          {/* Tags */}
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="Comma separated tags (e.g., #urgent, #backend)"
            placeholderTextColor={colors.text.secondary}
          />
        </PrismCard>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.ui.input,
    borderWidth: 1,
    borderColor: colors.ui.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  priorityButtonActive: {
    backgroundColor: colors.cosmic.purple + '30',
    borderColor: colors.cosmic.purple,
  },
  priorityText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  priorityTextActive: {
    color: colors.cosmic.purple,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  datePlaceholder: {
    fontSize: 16,
    color: colors.text.secondary,
  },
});
