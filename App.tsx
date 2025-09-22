import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { colors } from './src/styles/colors';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // In development, always show the main app (auto-login handled by AuthProvider)
  // In production, show auth screen if not logged in
  return (
    <>
      {(user || __DEV__) ? (
        <AppNavigator />
      ) : (
        <AuthScreen onAuthSuccess={() => {}} />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
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