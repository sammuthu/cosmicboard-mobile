import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Plus, CheckCircle, Circle, Trash2 } from 'lucide-react-native';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import apiService from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'ProjectDetail'>;
type RouteProp = { params: { projectId: string } };

interface Task {
  id: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ACTIVE' | 'COMPLETED' | 'DELETED';
  createdAt: string;
  completedAt?: string;
}

interface Reference {
  id: string;
  title: string;
  content: string;
  category: 'DOCUMENTATION' | 'SNIPPET' | 'CONFIGURATION' | 'TOOLS' | 'API' | 'TUTORIAL' | 'REFERENCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags: string[];
  url?: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function ProjectDetailScreen() {
  const route = useRoute<RouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { projectId } = route.params;
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'references' | 'media'>('tasks');
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newReferenceTitle, setNewReferenceTitle] = useState('');
  const [newReferenceContent, setNewReferenceContent] = useState('');
  const [newReferenceCategory, setNewReferenceCategory] = useState<'DOCUMENTATION' | 'SNIPPET' | 'CONFIGURATION' | 'TOOLS' | 'API' | 'TUTORIAL' | 'REFERENCE'>('SNIPPET');

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      // Load project details
      console.log('Loading project with ID:', projectId);
      const projectData = await apiService.getProject(projectId);
      setProject(projectData);
      
      // Load tasks
      const tasksData = await apiService.getTasks(projectId);
      console.log('Loaded tasks:', tasksData);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      
      // Load references
      const referencesData = await apiService.getReferences(projectId);
      console.log('Loaded references:', referencesData);
      setReferences(Array.isArray(referencesData) ? referencesData : []);
    } catch (error: any) {
      console.error('Failed to load project data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        config: error.config?.url
      });
      
      // Show user-friendly error message
      Alert.alert(
        'Connection Error',
        'Unable to load project data. Please ensure:\n\n' +
        '1. Your backend server is running on port 7778\n' +
        '2. You\'re logged in to the app\n\n' +
        'Error: ' + (error.message || 'Network error'),
        [{ text: 'OK' }]
      );
      
      // For now, use empty data if API fails
      setTasks([]);
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjectData();
    setRefreshing(false);
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
      await apiService.updateTask(projectId, task.id, { status: newStatus });
      loadProjectData();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const deleteTask = async (taskId: string) => {
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
              loadProjectData();
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const createTask = async () => {
    if (newTaskContent.trim()) {
      try {
        await apiService.createTask(projectId, {
          title: newTaskContent.trim(),
          content: newTaskContent.trim(),
          priority: 'MEDIUM',
          status: 'ACTIVE',
        });
        setNewTaskContent('');
        setShowTaskModal(false);
        loadProjectData();
      } catch (error) {
        console.error('Failed to create task:', error);
        Alert.alert('Error', 'Failed to create task');
      }
    }
  };

  const createReference = async () => {
    if (newReferenceTitle.trim()) {
      try {
        await apiService.createReference(projectId, {
          title: newReferenceTitle.trim(),
          content: newReferenceContent.trim(),
          category: newReferenceCategory.toLowerCase(),
        });
        setNewReferenceTitle('');
        setNewReferenceContent('');
        setNewReferenceCategory('SNIPPET');
        setShowReferenceModal(false);
        loadProjectData();
      } catch (error) {
        console.error('Failed to create reference:', error);
        Alert.alert('Error', 'Failed to create reference');
      }
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const priorityColors = {
      LOW: colors.cosmic.amber,
      MEDIUM: colors.cosmic.cyan,
      HIGH: colors.cosmic.purple,
      URGENT: colors.priority.supernova,
    };

    return (
      <PrismCard style={styles.taskCard}>
        <View style={styles.taskRow}>
          <TouchableOpacity onPress={() => toggleTaskStatus(item)}>
            {item.status === 'COMPLETED' ? (
              <CheckCircle color={colors.status.completed} size={24} />
            ) : (
              <Circle color={colors.text.secondary} size={24} />
            )}
          </TouchableOpacity>
          
          <View style={styles.taskContent}>
            <Text style={[
              styles.taskText,
              item.status === 'COMPLETED' && styles.taskCompleted
            ]}>
              {item.content}
            </Text>
            <View style={styles.taskMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority] + '20' }]}>
                <Text style={[styles.priorityText, { color: priorityColors[item.priority] }]}>
                  {item.priority}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => deleteTask(item.id)}>
            <Trash2 color={colors.status.deleted} size={20} />
          </TouchableOpacity>
        </View>
      </PrismCard>
    );
  };

  const renderReference = ({ item }: { item: Reference }) => {    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('ReferenceDetail', { reference: item })}
        activeOpacity={0.7}
      >
        <PrismCard style={styles.referenceCard}>
          <Text style={styles.referenceTitle}>{item.title}</Text>
          <View style={styles.referenceMeta}>
            <Text style={styles.referenceCategory}>{item.category}</Text>
            {item.url && (
              <Text style={styles.referenceUrl} numberOfLines={1}>
                {item.url}
              </Text>
            )}
          </View>
          
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {item.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </PrismCard>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with project name */}
      {project && (
        <View style={styles.header}>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.projectDescription}>{project.description}</Text>
          )}
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            Tasks ({tasks.filter(t => t.status === 'ACTIVE').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'references' && styles.activeTab]}
          onPress={() => setActiveTab('references')}
        >
          <Text style={[styles.tabText, activeTab === 'references' && styles.activeTabText]}>
            References ({references.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'media' && styles.activeTab]}
          onPress={() => navigation.navigate('MediaScreen', { projectId })}
        >
          <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>
            Media
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'tasks' ? (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.cosmic.purple}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>Tap + to create your first task</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={references}
          keyExtractor={(item) => item.id}
          renderItem={renderReference}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.cosmic.purple}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No references yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first reference</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => activeTab === 'tasks' ? setShowTaskModal(true) : setShowReferenceModal(true)}
      >
        <Plus color={colors.text.primary} size={24} />
      </TouchableOpacity>

      {/* Task Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter task description..."
              placeholderTextColor={colors.text.secondary}
              value={newTaskContent}
              onChangeText={setNewTaskContent}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setNewTaskContent('');
                  setShowTaskModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={createTask}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reference Modal */}
      <Modal
        visible={showReferenceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReferenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Reference</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter title..."
              placeholderTextColor={colors.text.secondary}
              value={newReferenceTitle}
              onChangeText={setNewReferenceTitle}
              autoFocus
            />
            
            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <View style={styles.categoryContainer}>
                {(['SNIPPET', 'DOCUMENTATION', 'API', 'CONFIGURATION', 'TOOLS', 'TUTORIAL', 'REFERENCE'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      newReferenceCategory === cat && styles.categoryChipActive
                    ]}
                    onPress={() => setNewReferenceCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      newReferenceCategory === cat && styles.categoryChipTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder={newReferenceCategory === 'SNIPPET' ? "Enter code snippet..." : "Enter content (optional)..."}
              placeholderTextColor={colors.text.secondary}
              value={newReferenceContent}
              onChangeText={setNewReferenceContent}
              multiline
              numberOfLines={6}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setNewReferenceTitle('');
                  setNewReferenceContent('');
                  setNewReferenceCategory('SNIPPET');
                  setShowReferenceModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={createReference}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100, // Space for FAB
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.divider,
  },
  projectName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  projectDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.cosmic.purple,
  },
  tabText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.cosmic.purple,
    fontWeight: '600',
  },
  taskCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.muted,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  referenceCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  referenceCardExpanded: {
    maxHeight: 600,
  },
  expandedContent: {
    marginTop: 8,
    maxHeight: 500,
  },
  noContent: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    padding: 12,
  },
  referenceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  referenceCategory: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  referenceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  referenceUrl: {
    fontSize: 12,
    color: colors.cosmic.cyan,
    flex: 1,
    marginLeft: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.cosmic.purple + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.cosmic.purple,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cosmic.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: 12,
  },
  modalTextArea: {
    height: 120,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  modalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  categoryScroll: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.ui.border,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  categoryChipActive: {
    backgroundColor: colors.cosmic.purple + '20',
    borderColor: colors.cosmic.purple,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.cosmic.purple,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: colors.ui.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.cosmic.purple,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalButtonTextPrimary: {
    color: colors.text.primary,
  },
});