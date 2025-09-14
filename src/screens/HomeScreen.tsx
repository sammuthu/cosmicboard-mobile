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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import {
  FolderOpen,
  ListTodo,
  Code,
  Image,
  Search,
  Settings,
  Star,
  Moon,
  Sun,
  Zap,
  Sparkles,
  Cloud
} from 'lucide-react-native';
import { colors } from '../styles/colors';
import PrismCard from '../components/PrismCard';
import apiService from '../services/api';
import authService from '../services/auth.service';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type NavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;
type TabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

const { width } = Dimensions.get('window');

interface Theme {
  id: string;
  name: string;
  icon: React.ReactNode;
  colors: {
    primary: string;
    secondary: string;
  };
}

const themes: Theme[] = [
  { id: 'cosmic', name: 'Cosmic', icon: <Star size={20} color="#8B5CF6" />, colors: { primary: '#8B5CF6', secondary: '#EC4899' } },
  { id: 'nebula', name: 'Nebula', icon: <Cloud size={20} color="#3B82F6" />, colors: { primary: '#3B82F6', secondary: '#06B6D4' } },
  { id: 'stellar', name: 'Stellar', icon: <Sun size={20} color="#F59E0B" />, colors: { primary: '#F59E0B', secondary: '#EF4444' } },
  { id: 'aurora', name: 'Aurora', icon: <Sparkles size={20} color="#10B981" />, colors: { primary: '#10B981', secondary: '#14B8A6' } },
  { id: 'quantum', name: 'Quantum', icon: <Zap size={20} color="#8B5CF6" />, colors: { primary: '#8B5CF6', secondary: '#3B82F6' } },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const tabNavigation = useNavigation<TabNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('cosmic');
  const [user, setUser] = useState<any>(null);
  const [currentPriority, setCurrentPriority] = useState<any>(null);
  const [projectsCount, setProjectsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [referencesCount, setReferencesCount] = useState(0);

  const loadData = async () => {
    try {
      // Get user info - in dev mode, use mock user
      if (__DEV__) {
        setUser({
          email: 'nmuthu@gmail.com',
          name: 'N Muthu',
          id: 'dev-user-001'
        });
      } else {
        const storedUser = await authService.getStoredUser();
        setUser(storedUser);
      }

      // Get projects count
      const projects = await apiService.getProjects();
      setProjectsCount(projects.length);

      // Calculate total tasks and references
      let totalTasks = 0;
      let totalRefs = 0;

      for (const project of projects) {
        if (project.tasksCount) totalTasks += project.tasksCount;
        if (project.referencesCount) totalRefs += project.referencesCount;
      }

      setTasksCount(totalTasks);
      setReferencesCount(totalRefs);

      // Get current priority task (first supernova task)
      if (projects.length > 0) {
        for (const project of projects) {
          try {
            const tasks = await apiService.getTasks(project.id || project._id);
            const supernovaTasks = tasks.filter((t: any) =>
              t.priority === 'SUPERNOVA' && t.status === 'ACTIVE'
            );
            if (supernovaTasks.length > 0) {
              setCurrentPriority({
                ...supernovaTasks[0],
                projectName: project.name
              });
              break;
            }
          } catch (error) {
            console.error('Error loading tasks:', error);
          }
        }
      }
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

  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const features = [
    {
      id: 'projects',
      title: 'Projects',
      icon: <FolderOpen size={32} color={colors.cosmic.purple} />,
      color: colors.cosmic.purple,
      onPress: () => {
        // Navigate to Projects tab
        tabNavigation.navigate('Projects');
      }
    },
    {
      id: 'tasks',
      title: 'Tasks',
      icon: <ListTodo size={32} color={colors.cosmic.cyan} />,
      color: colors.cosmic.cyan,
      onPress: () => {
        // For now, navigate to Projects screen since tasks are per project
        tabNavigation.navigate('Projects');
      }
    },
    {
      id: 'scrolls',
      title: 'Scrolls',
      icon: <Code size={32} color={colors.cosmic.amber} />,
      color: colors.cosmic.amber,
      onPress: () => {
        // For now, navigate to Projects screen since references are per project
        navigation.getParent()?.navigate('Projects');
      }
    },
    {
      id: 'media',
      title: 'Media',
      icon: <Image size={32} color={colors.cosmic.pink} />,
      color: colors.cosmic.pink,
      onPress: () => {
        // For now, navigate to Projects screen since media is per project
        navigation.getParent()?.navigate('Projects');
      }
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading cosmic space...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.cosmic.purple}
        />
      }
    >
      {/* Theme Selector Section */}
      <View style={styles.themeContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.themeScrollContent}
        >
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeButton,
                selectedTheme === theme.id && styles.themeButtonActive
              ]}
              onPress={() => setSelectedTheme(theme.id)}
            >
              {theme.icon}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* User Avatar */}
        <TouchableOpacity style={styles.avatarContainer}>
          <LinearGradient
            colors={[colors.cosmic.purple, colors.cosmic.pink]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{getUserInitial()}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.pink, colors.cosmic.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleGradient}
        >
          <Text style={styles.titleText}>Cosmic Space</Text>
        </LinearGradient>
        <Text style={styles.subtitle}>Align your actions with the cosmos</Text>
      </View>

      {/* Feature Grid */}
      <View style={styles.featureContainer}>
        <View style={styles.featureGrid}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={feature.onPress}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[feature.color + '20', feature.color + '10']}
                style={styles.featureGradient}
              >
                <View style={styles.featureIconContainer}>
                  {feature.icon}
                </View>
                <Text style={[styles.featureTitle, { color: feature.color }]}>{feature.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Current Priority */}
      {currentPriority && (
        <PrismCard style={styles.priorityCard}>
          <View style={styles.priorityHeader}>
            <Text style={styles.priorityLabel}>Current Priority</Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityBadgeText}>SUPERNOVA</Text>
            </View>
          </View>
          <Text style={styles.priorityTitle}>{currentPriority.title}</Text>
          <Text style={styles.priorityProject}>{currentPriority.projectName}</Text>
        </PrismCard>
      )}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{projectsCount}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tasksCount}</Text>
          <Text style={styles.statLabel}>Active Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{referencesCount}</Text>
          <Text style={styles.statLabel}>References</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.border,
  },
  themeScrollContent: {
    paddingRight: 60, // Space for avatar
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeButtonActive: {
    borderColor: colors.cosmic.purple,
  },
  avatarContainer: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  titleGradient: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  featureContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  featureCard: {
    width: (width - 32 - 48) / 4, // 4 columns
    aspectRatio: 1,
    marginBottom: 16,
  },
  featureGradient: {
    flex: 1,
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.ui.border + '30',
  },
  featureIconContainer: {
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  priorityCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  priorityBadge: {
    backgroundColor: colors.priority.supernova,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  priorityTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityProject: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.cosmic.purple,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});