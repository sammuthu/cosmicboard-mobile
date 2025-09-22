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
import { useTheme } from '../contexts/ThemeContext';
import apiService from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
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
          icon: <CheckCircle size={14} color={theme.colors.status.completed} />,
        },
        {
          id: '2',
          user: 'Team',
          action: 'shared',
          target: 'AI Assistant project',
          time: '5h ago',
          icon: <Users size={14} color={theme.colors.cosmic.cyan} />,
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
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background.primary }]}>
        <ActivityIndicator size="large" color={theme.colors.cosmic.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: 50 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.cosmic.purple}
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
            colors={[theme.colors.background.elevated, theme.colors.background.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.cosmic.purple + '15' }]}>
              <TrendingUp size={20} color={theme.colors.cosmic.purple} />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>{stats.projects}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>PROJECTS</Text>
          </LinearGradient>

          <LinearGradient
            colors={[theme.colors.background.elevated, theme.colors.background.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.cosmic.cyan + '15' }]}>
              <Zap size={20} color={theme.colors.cosmic.cyan} />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>{stats.activeTasks}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>ACTIVE</Text>
          </LinearGradient>

          <LinearGradient
            colors={[theme.colors.background.elevated, theme.colors.background.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.status.completed + '15' }]}>
              <CheckCircle size={20} color={theme.colors.status.completed} />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>{stats.completedToday}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>TODAY</Text>
          </LinearGradient>
        </ScrollView>

        {/* Priority Tasks */}
        {priorityTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.sectionIcon, {
                  backgroundColor: theme.colors.cosmic.purple + '15'
                }]}
              >
                <Zap size={18} color={theme.colors.cosmic.purple} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Priority</Text>
            </View>

            {priorityTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => {
                  // TaskDetail not implemented yet
                  console.log('TaskDetail navigation disabled - screen not implemented');
                }}
                activeOpacity={0.9}
              >
                <View
                  style={[styles.taskCard, {
                    backgroundColor: theme.colors.background.card,
                    borderColor: theme.colors.ui.border
                  }]}
                >
                  <View style={styles.taskContent}>
                    <View style={[
                      styles.priorityDot,
                      { backgroundColor: task.priority === 'SUPERNOVA' ? theme.colors.priority.supernova : theme.colors.priority.stellar }
                    ]} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>{task.title}</Text>
                      <Text style={[styles.taskProject, { color: theme.colors.text.secondary }]}>{task.projectName}</Text>
                    </View>
                    <ArrowRight size={16} color={theme.colors.text.muted} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIcon, {
                backgroundColor: theme.colors.cosmic.cyan + '15'
              }]}
            >
              <Activity size={18} color={theme.colors.cosmic.cyan} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Activity</Text>
          </View>

          <View style={[styles.activityCard, { backgroundColor: theme.colors.background.card, borderColor: theme.colors.ui.border }]}>
            {recentActivity.map((activity, index) => (
              <View
                key={activity.id}
                style={[
                  styles.activityItem,
                  index < recentActivity.length - 1 && [styles.activityBorder, { borderBottomColor: theme.colors.ui.border + '15' }]
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.background.tertiary }]}>
                  {activity.icon}
                </View>
                <View style={styles.activityText}>
                  <Text style={[styles.activityLine, { color: theme.colors.text.secondary }]}>
                    <Text style={[styles.activityUser, { color: theme.colors.text.primary }]}>{activity.user}</Text>
                    {' '}{activity.action}{' '}
                    <Text style={[styles.activityTarget, { color: theme.colors.cosmic.purple }]}>{activity.target}</Text>
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.text.muted }]}>{activity.time}</Text>
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
          colors={[theme.colors.cosmic.blue, theme.colors.cosmic.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fabGradient, { shadowColor: theme.colors.cosmic.purple }]}
        >
          <Plus size={28} color='#ffffff' />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsScroll: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  statCard: {
    width: 110,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  taskCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  taskProject: {
    fontSize: 13,
    fontWeight: '400',
  },
  activityCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    gap: 14,
  },
  activityBorder: {
    borderBottomWidth: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityTarget: {
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
});