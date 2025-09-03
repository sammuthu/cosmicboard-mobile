import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../styles/colors';

type RootStackParamList = {
  ReferenceDetail: { reference: Reference };
};

type ReferenceDetailScreenRouteProp = RouteProp<RootStackParamList, 'ReferenceDetail'>;
type ReferenceDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReferenceDetail'>;

interface Reference {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  tags: string[];
  url?: string;
  createdAt: string;
}

interface Props {
  route: ReferenceDetailScreenRouteProp;
  navigation: ReferenceDetailScreenNavigationProp;
}

const highlightLine = (line: string, category?: string) => {
  const javaKeywords = /\b(package|import|public|private|protected|class|interface|extends|implements|static|final|void|int|long|double|float|boolean|char|byte|short|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|throws|new|this|super|@\w+)\b/g;
  const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|async|await|new|this|typeof|instanceof|try|catch|finally|throw)\b/g;
  
  let keywords = jsKeywords;
  if (category === 'SNIPPET' || category === 'API') {
    if (line.includes('package ') || line.includes('import java') || line.includes('@')) {
      keywords = javaKeywords;
    }
  }
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = keywords.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: line.substring(lastIndex, match.index),
        isKeyword: false,
        isAnnotation: false,
      });
    }
    parts.push({
      text: match[0],
      isKeyword: !match[0].startsWith('@'),
      isAnnotation: match[0].startsWith('@'),
    });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < line.length) {
    parts.push({
      text: line.substring(lastIndex),
      isKeyword: false,
      isAnnotation: false,
    });
  }
  
  return parts.length > 0 ? parts : [{ text: line, isKeyword: false, isAnnotation: false }];
};

export default function ReferenceDetailScreen({ route, navigation }: Props) {
  const { reference } = route.params;
  
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: reference.title,
      headerStyle: {
        backgroundColor: colors.background.secondary,
      },
      headerTintColor: colors.text.primary,
    });
  }, [navigation, reference.title]);

  // Clean up code - remove markdown code block markers if present
  let cleanCode = reference.content?.trim() || '';
  if (cleanCode.startsWith('```')) {
    cleanCode = cleanCode.replace(/^```\w*\n?/, '');
    cleanCode = cleanCode.replace(/\n?```$/, '');
  }
  
  const lines = cleanCode.split('\n');
  const isCode = reference.category === 'SNIPPET' || reference.category === 'API' || reference.category === 'CONFIGURATION';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{reference.title}</Text>
        <View style={styles.metadata}>
          <View style={[styles.badge, styles[`${reference.category.toLowerCase()}Badge`]]}>
            <Text style={styles.badgeText}>{reference.category}</Text>
          </View>
          <View style={[styles.badge, styles.priorityBadge]}>
            <Text style={styles.badgeText}>{reference.priority}</Text>
          </View>
        </View>
        {reference.tags && reference.tags.length > 0 && (
          <View style={styles.tags}>
            {reference.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isCode ? (
        <View style={styles.codeWrapper}>
          <View style={styles.languageHeader}>
            <Text style={styles.languageLabel}>{reference.category.toLowerCase()}</Text>
          </View>
          <ScrollView 
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            style={styles.horizontalScroll}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              style={styles.verticalScroll}
            >
              <View style={styles.codeContainer}>
                {lines.map((line, index) => {
                  const parts = highlightLine(line, reference.category);
                  return (
                    <View key={index} style={styles.lineContainer}>
                      <Text style={styles.lineNumber}>{String(index + 1).padStart(3, ' ')}</Text>
                      <View style={styles.lineContent}>
                        {parts.map((part, i) => (
                          <Text
                            key={i}
                            style={[
                              styles.codeText,
                              part.isKeyword && styles.keyword,
                              part.isAnnotation && styles.annotation,
                            ]}
                          >
                            {part.text}
                          </Text>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={styles.documentationScroll}>
          <Text style={styles.documentationText}>{cleanCode}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  snippetBadge: {
    backgroundColor: colors.cosmic.purple + '30',
  },
  documentationBadge: {
    backgroundColor: colors.cosmic.blue + '30',
  },
  apiBadge: {
    backgroundColor: colors.cosmic.cyan + '30',
  },
  configurationBadge: {
    backgroundColor: colors.cosmic.green + '30',
  },
  priorityBadge: {
    backgroundColor: colors.background.tertiary,
  },
  badgeText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginTop: 4,
  },
  tagText: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  codeWrapper: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  languageHeader: {
    backgroundColor: '#2d2d2d',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  languageLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  horizontalScroll: {
    flex: 1,
  },
  verticalScroll: {
    flex: 1,
  },
  codeContainer: {
    padding: 12,
    minWidth: 800,
  },
  lineContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  lineNumber: {
    color: '#6e7681',
    fontSize: 12,
    fontFamily: 'monospace',
    marginRight: 12,
    minWidth: 30,
  },
  lineContent: {
    flexDirection: 'row',
    flex: 1,
  },
  codeText: {
    color: '#d4d4d4',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  keyword: {
    color: '#c586c0',
    fontWeight: '600',
  },
  annotation: {
    color: '#dcdcaa',
  },
  documentationScroll: {
    flex: 1,
    padding: 16,
  },
  documentationText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});