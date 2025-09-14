import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, Search, Settings, FolderOpen, FileText, Code, Image } from 'lucide-react-native';
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
          header: () => (
            <LinearGradient
              colors={[theme.colors.background.secondary, theme.colors.background.primary]}
              style={[styles.header, { borderBottomColor: theme.colors.ui.border + '30' }]}
            >
              <View style={styles.headerContent}>
                <LinearGradient
                  colors={[theme.colors.cosmic.purple, theme.colors.cosmic.pink, theme.colors.cosmic.cyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.titleGradient}
                >
                  <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Cosmic Space</Text>
                </LinearGradient>
                <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>Align your actions with the cosmos</Text>
              </View>
            </LinearGradient>
          ),
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
  },
  headerContent: {
    alignItems: 'center',
  },
  titleGradient: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default function AppNavigator() {
  const { theme } = useTheme();
  return (
    <NavigationContainer>
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