import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import authService from './src/services/auth.service';
import { colors } from './src/styles/colors';
import { ThemeProvider } from './src/contexts/ThemeContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Auto-login for development
    if (__DEV__) {
      const devUser = {
        email: 'nmuthu@gmail.com',
        name: 'Dev User',
        id: 'dev-user-001'
      };
      setUser(devUser);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      checkAuthStatus();
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = authService.isAuthenticated();
      if (authenticated) {
        const storedUser = await authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cosmic.purple} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {isAuthenticated ? (
          <AppNavigator />
        ) : (
          <AuthScreen onAuthSuccess={handleAuthSuccess} />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text.secondary,
    fontSize: 16,
  },
});