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
  ArrowRight,
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
  const [stats, setStats] = useState({
    projects: 0,
    completedToday: 0,
    activeTasks: 0,
  });

  const loadData = async () => {
    try {
      const projects = await apiService.getProjects();

      const allPriorityTasks: any[] = [];
      let completedTodayCount = 0;
      let activeTasksCount = 0;

      for (const project of projects) {
        try {
          const tasks = await apiService.getTasks(project.id || project._id);

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

          const activeTasks = tasks.filter((t: any) => t.status === 'ACTIVE');
          activeTasksCount += activeTasks.length;

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

      allPriorityTasks.sort((a, b) => {
        if (a.priority === 'SUPERNOVA' && b.priority !== 'SUPERNOVA') return -1;
        if (a.priority !== 'SUPERNOVA' && b.priority === 'SUPERNOVA') return 1;
        return 0;
      });

      setPriorityTasks(allPriorityTasks.slice(0, 3));
      setStats({
        projects: projects.length,
        completedToday: completedTodayCount,
        activeTasks: activeTasksCount,
      });

      setRecentActivity([
        {
          id: '1',
          user: 'You',
          action: 'completed',
          target: 'Setup authentication',
          time: '2h ago',
          icon: <CheckCircle size={14} color={colors.status.completed} />,
        },
        {
          id: '2',
          user: 'Team',
          action: 'shared',
          target: 'AI Assistant project',
          time: '5h ago',
          icon: <Users size={14} color={colors.cosmic.cyan} />,
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
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
        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <LinearGradient
            colors={[colors.cosmic.purple + '20', colors.cosmic.purple + '10']}
            style={styles.statCard}
          >
            <View style={styles.statIconBox}>
              <TrendingUp size={18} color={colors.cosmic.purple} />
            </View>
            <Text style={styles.statNumber}>{stats.projects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </LinearGradient>

          <LinearGradient
            colors={[colors.cosmic.cyan + '20', colors.cosmic.cyan + '10']}
            style={styles.statCard}
          >
            <View style={styles.statIconBox}>
              <Zap size={18} color={colors.cosmic.cyan} />
            </View>
            <Text style={styles.statNumber}>{stats.activeTasks}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>

          <LinearGradient
            colors={[colors.status.completed + '20', colors.status.completed + '10']}
            style={styles.statCard}
          >
            <View style={styles.statIconBox}>
              <CheckCircle size={18} color={colors.status.completed} />
            </View>
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </LinearGradient>
        </ScrollView>

        {/* Priority Tasks */}
        {priorityTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.cosmic.purple, colors.cosmic.pink]}
                style={styles.sectionIcon}
              >
                <Zap size={16} color={colors.text.primary} />
              </LinearGradient>
              <Text style={styles.sectionTitle}>Priority</Text>
            </View>

            {priorityTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => navigation.navigate('TaskDetail', {
                  taskId: task.id,
                  projectId: task.projectId
                })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.background.secondary, colors.background.tertiary]}
                  style={styles.taskCard}
                >
                  <View style={styles.taskContent}>
                    <View style={[
                      styles.priorityDot,
                      { backgroundColor: task.priority === 'SUPERNOVA' ? colors.priority.supernova : colors.priority.stellar }
                    ]} />
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                      <Text style={styles.taskProject}>{task.projectName}</Text>
                    </View>
                    <ArrowRight size={16} color={colors.text.muted} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={[colors.cosmic.cyan, colors.cosmic.blue]}
              style={styles.sectionIcon}
            >
              <Activity size={16} color={colors.text.primary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Activity</Text>
          </View>

          <View style={styles.activityCard}>
            {recentActivity.map((activity, index) => (
              <View
                key={activity.id}
                style={[
                  styles.activityItem,
                  index < recentActivity.length - 1 && styles.activityBorder
                ]}
              >
                <View style={styles.activityIcon}>
                  {activity.icon}
                </View>
                <View style={styles.activityText}>
                  <Text style={styles.activityLine}>
                    <Text style={styles.activityUser}>{activity.user}</Text>
                    {' '}{activity.action}{' '}
                    <Text style={styles.activityTarget}>{activity.target}</Text>
                  </Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: 'new' })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.pink]}
          style={styles.fabGradient}
        >
          <Plus size={24} color={colors.text.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
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
  statsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    width: 100,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.ui.border + '20',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background.primary + '50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  taskCard: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.ui.border + '20',
    overflow: 'hidden',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  taskProject: {
    fontSize: 12,
    color: colors.text.muted,
  },
  activityCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.ui.border + '20',
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 10,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border + '15',
  },
  activityIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityLine: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  activityUser: {
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityTarget: {
    color: colors.cosmic.purple,
  },
  activityTime: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
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
    shadowColor: colors.cosmic.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});