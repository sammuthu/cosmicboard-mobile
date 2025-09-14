import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Zap,
  Clock,
  TrendingUp,
  Star,
  CheckCircle,
  Plus,
  Activity,
  Users,
} from 'lucide-react-native';
import { colors } from '../styles/colors';
import apiService from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [priorityTasks, setPriorityTasks] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  const loadData = async () => {
    try {
      // Get projects
      const projects = await apiService.getProjects();
      setProjectsCount(projects.length);

      // Get priority tasks from all projects
      const allPriorityTasks: any[] = [];
      let completedTodayCount = 0;

      for (const project of projects) {
        try {
          const tasks = await apiService.getTasks(project.id || project._id);

          // Get high priority tasks
          const highPriorityTasks = tasks
            .filter((t: any) =>
              (t.priority === 'SUPERNOVA' || t.priority === 'STELLAR') &&
              t.status === 'ACTIVE'
            )
            .map((t: any) => ({
              ...t,
              projectName: project.name,
              projectId: project.id || project._id,
            }));

          allPriorityTasks.push(...highPriorityTasks);

          // Count tasks completed today
          const today = new Date().toDateString();
          const todayCompleted = tasks.filter((t: any) => {
            if (t.status === 'COMPLETED' && t.completedAt) {
              return new Date(t.completedAt).toDateString() === today;
            }
            return false;
          });
          completedTodayCount += todayCompleted.length;
        } catch (error) {
          console.error('Error loading tasks:', error);
        }
      }

      // Sort by priority and take top 5
      allPriorityTasks.sort((a, b) => {
        if (a.priority === 'SUPERNOVA' && b.priority !== 'SUPERNOVA') return -1;
        if (a.priority !== 'SUPERNOVA' && b.priority === 'SUPERNOVA') return 1;
        return 0;
      });
      setPriorityTasks(allPriorityTasks.slice(0, 5));
      setCompletedToday(completedTodayCount);

      // Mock recent activity for now
      setRecentActivity([
        {
          id: '1',
          type: 'task_completed',
          user: 'You',
          action: 'completed task',
          target: 'Setup authentication flow',
          project: 'CosmicBoard Development',
          time: '2 hours ago',
          icon: <CheckCircle size={16} color={colors.status.completed} />,
        },
        {
          id: '2',
          type: 'project_shared',
          user: 'Team Member',
          action: 'shared project',
          target: 'AI Assistant Integration',
          time: '5 hours ago',
          icon: <Users size={16} color={colors.cosmic.cyan} />,
        },
        {
          id: '3',
          type: 'task_created',
          user: 'You',
          action: 'created task',
          target: 'Implement real-time charts',
          project: 'Data Visualization',
          time: '1 day ago',
          icon: <Plus size={16} color={colors.cosmic.purple} />,
        },
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'SUPERNOVA':
        return colors.priority.supernova;
      case 'STELLAR':
        return colors.priority.stellar;
      default:
        return colors.priority.nebula;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading your cosmos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.cosmic.purple}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <TrendingUp size={20} color={colors.cosmic.purple} />
          </View>
          <View>
            <Text style={styles.statValue}>{projectsCount}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <CheckCircle size={20} color={colors.status.completed} />
          </View>
          <View>
            <Text style={styles.statValue}>{completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Star size={20} color={colors.cosmic.amber} />
          </View>
          <View>
            <Text style={styles.statValue}>{priorityTasks.length}</Text>
            <Text style={styles.statLabel}>Priority Tasks</Text>
          </View>
        </View>
      </View>

      {/* Priority Tasks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Zap size={20} color={colors.cosmic.purple} />
          <Text style={styles.sectionTitle}>Priority Tasks</Text>
        </View>

        {priorityTasks.length > 0 ? (
          priorityTasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => navigation.navigate('TaskDetail', {
                taskId: task.id,
                projectId: task.projectId
              })}
              activeOpacity={0.8}
            >
              <View style={styles.taskHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                  <Text style={styles.priorityText}>{task.priority}</Text>
                </View>
                <Text style={styles.taskProject}>{task.projectName}</Text>
              </View>
              <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
              {task.dueDate && (
                <View style={styles.taskFooter}>
                  <Clock size={12} color={colors.text.muted} />
                  <Text style={styles.dueDate}>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No priority tasks</Text>
            <Text style={styles.emptySubtext}>All caught up! 🎉</Text>
          </View>
        )}
      </View>

      {/* Activity Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Activity size={20} color={colors.cosmic.cyan} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              {activity.icon}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                <Text style={styles.activityUser}>{activity.user}</Text>
                {' '}{activity.action}{' '}
                <Text style={styles.activityTarget}>{activity.target}</Text>
              </Text>
              {activity.project && (
                <Text style={styles.activityProject}>{activity.project}</Text>
              )}
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: 'new' })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.pink]}
          style={styles.fabGradient}
        >
          <Plus size={28} color={colors.text.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 100,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  taskCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.ui.border + '30',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  taskProject: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 22,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  dueDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.muted,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border + '20',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityTarget: {
    fontWeight: '500',
    color: colors.cosmic.purple,
  },
  activityProject: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});