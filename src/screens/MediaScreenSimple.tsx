import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '../styles/colors';

interface MediaScreenProps {
  projectId: string;
}

export default function MediaScreenSimple() {
  const route = useRoute();
  const { projectId } = route.params as MediaScreenProps;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Media Screen</Text>
      <Text style={styles.subtitle}>Project ID: {projectId}</Text>
      <Text style={styles.message}>This is working! Navigation successful.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: colors.cosmic.purple,
    textAlign: 'center',
  },
});