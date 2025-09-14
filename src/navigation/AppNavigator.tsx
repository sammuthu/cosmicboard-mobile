import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Search, Settings, FolderOpen, FileText, Code, Image } from 'lucide-react-native';
import { colors } from '../styles/colors';
import { useTheme } from '../contexts/ThemeContext';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import ReferenceDetailScreen from '../screens/ReferenceDetailScreen';
import MediaScreen from '../screens/MediaScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ProjectDetail: { projectId: string };
  TaskDetail: { taskId: string; projectId: string };
  ReferenceDetail: { reference: any };
  Media: { projectId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Projects: undefined;
  Search: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.background.secondary,
          borderTopColor: theme.colors.ui.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.colors.cosmic.purple,
        tabBarInactiveTintColor: theme.colors.text.muted,
        headerStyle: {
          backgroundColor: theme.colors.background.secondary,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.colors.text.primary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} />
          ),
          header: () => {
            const { theme } = useTheme();
            return (
              <View style={[styles.header, { backgroundColor: theme.colors.background.secondary }]}>
                <View style={styles.headerContent}>
                  <LinearGradient
                    colors={[theme.colors.cosmic.purple, theme.colors.cosmic.pink, theme.colors.cosmic.cyan]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleGradient}
                  >
                    <Text style={styles.headerTitle}>Cosmic Space</Text>
                  </LinearGradient>
                  <LinearGradient
                    colors={[theme.colors.cosmic.cyan, theme.colors.cosmic.purple, theme.colors.cosmic.pink]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subtitleGradient}
                  >
                    <Text style={styles.headerSubtitle}>Align your actions with the cosmos</Text>
                  </LinearGradient>
                </View>
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <FolderOpen color={color} size={size} />
          ),
          headerTitle: 'Projects',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 44, // Status bar height
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    alignItems: 'center',
  },
  titleGradient: {
    marginBottom: 6,
  },
  subtitleGradient: {
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: 'transparent',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: 'transparent',
  },
});

export default function AppNavigator() {
  const { theme, themeName } = useTheme();

  // Determine StatusBar style based on theme
  const statusBarStyle = themeName === 'daylight' ? 'dark' : 'light';

  return (
    <NavigationContainer>
      <StatusBar style={statusBarStyle} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background.secondary,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: theme.colors.text.primary,
          cardStyle: {
            backgroundColor: theme.colors.background.primary,
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProjectDetail"
          component={ProjectDetailScreen}
          options={{
            title: 'Project Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{
            title: 'Task Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="ReferenceDetail"
          component={ReferenceDetailScreen}
          options={{
            title: 'Reference Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="Media"
          component={MediaScreen}
          options={{
            title: 'Media',
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}