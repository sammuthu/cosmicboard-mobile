import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

interface CodeDisplayProps {
  code: string;
  language?: string;
  category?: string;
}

// Simple keyword highlighting for common languages
const highlightLine = (line: string, category?: string) => {
  // Keywords for different languages
  const javaKeywords = /\b(package|import|public|private|protected|class|interface|extends|implements|static|final|void|int|long|double|float|boolean|char|byte|short|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|throws|new|this|super|@\w+)\b/g;
  const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|async|await|new|this|typeof|instanceof|try|catch|finally|throw)\b/g;
  
  let keywords = jsKeywords; // default
  if (category === 'SNIPPET' || category === 'API') {
    // Check if it looks like Java
    if (line.includes('package ') || line.includes('import java') || line.includes('@')) {
      keywords = javaKeywords;
    }
  }
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  // Find keywords
  while ((match = keywords.exec(line)) !== null) {
    // Add text before keyword
    if (match.index > lastIndex) {
      parts.push({
        text: line.substring(lastIndex, match.index),
        isKeyword: false,
        isAnnotation: false,
      });
    }
    // Add keyword
    parts.push({
      text: match[0],
      isKeyword: !match[0].startsWith('@'),
      isAnnotation: match[0].startsWith('@'),
    });
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < line.length) {
    parts.push({
      text: line.substring(lastIndex),
      isKeyword: false,
      isAnnotation: false,
    });
  }
  
  return parts.length > 0 ? parts : [{ text: line, isKeyword: false, isAnnotation: false }];
};

export default function CodeDisplay({ code, category }: CodeDisplayProps) {
  if (!code) {
    return null;
  }
  
  // Clean up code - remove markdown code block markers if present
  let cleanCode = code.trim();
  if (cleanCode.startsWith('```')) {
    // Remove opening ```language
    cleanCode = cleanCode.replace(/^```\w*\n?/, '');
    // Remove closing ```
    cleanCode = cleanCode.replace(/\n?```$/, '');
  }
  
  // If no content after cleanup, return null
  if (!cleanCode) {
    return null;
  }
  
  const lines = cleanCode.split('\n');
  
  // Determine if it's code or documentation
  const isCode = category === 'SNIPPET' || category === 'API' || category === 'CONFIGURATION';
  
  if (!isCode || category === 'DOCUMENTATION') {
    return (
      <View style={styles.plainTextContainer}>
        <Text style={styles.plainText}>{cleanCode}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.languageHeader}>
        <Text style={styles.languageLabel}>{category.toLowerCase()}</Text>
      </View>
      <ScrollView 
        style={styles.codeScrollView}
        contentContainerStyle={styles.codeScrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        <View style={styles.codeContainer}>
          {lines.map((line, index) => {
            const parts = highlightLine(line, category);
            return (
              <View key={index} style={styles.lineContainer}>
                <Text style={styles.lineNumber}>{String(index + 1).padStart(3, ' ')}</Text>
                <View style={styles.lineTextContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    maxHeight: 400,
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
  codeScrollView: {
    maxHeight: 350,
  },
  codeScrollContent: {
    flexGrow: 1,
  },
  codeContainer: {
    padding: 12,
    paddingRight: 24,
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
  lineTextContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'nowrap',
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
  plainTextContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.cosmic.purple,
  },
  plainText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});