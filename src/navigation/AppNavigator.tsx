import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, Search, Settings, FolderOpen, FileText, Code, Image } from 'lucide-react-native';
import { useThemeColors } from '../hooks/useThemeColors';

// Import screens (we'll create these next)
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import ReferenceDetailScreen from '../screens/ReferenceDetailScreen';
import MediaScreen from '../screens/MediaScreen';
import ThemeCustomizationScreen from '../screens/ThemeCustomizationScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ProjectDetail: { projectId: string };
  TaskDetail: { taskId: string; projectId: string };
  ReferenceDetail: { reference: any };
  MediaScreen: { projectId: string };
  ThemeCustomization: { template: any };
};

export type MainTabParamList = {
  Projects: undefined;
  Search: undefined;
  Media: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.ui.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.cosmic.purple,
        tabBarInactiveTintColor: colors.text.muted,
        headerStyle: {
          backgroundColor: colors.background.secondary,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarLabel: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <FolderOpen color={color} size={size} />
          ),
          headerTitle: 'Cosmic Space',
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
        name="Media"
        component={MediaScreen}
        options={{
          tabBarLabel: 'Media',
          tabBarIcon: ({ color, size }) => (
            <Image color={color} size={size} />
          ),
          headerTitle: 'Media Gallery',
        }}
        initialParams={{ projectId: 'all' }}
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

export default function AppNavigator() {
  const colors = useThemeColors();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background.secondary,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: colors.text.primary,
          cardStyle: {
            backgroundColor: colors.background.primary,
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
          name="MediaScreen"
          component={MediaScreen}
          options={{
            title: 'Project Media',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="ThemeCustomization"
          component={ThemeCustomizationScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}