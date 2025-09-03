import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

interface SyntaxHighlightProps {
  code: string;
  language?: string;
  category?: string;
}

const detectLanguage = (code: string, category?: string): string => {
  // Check category hints
  if (category === 'SNIPPET' || category === 'API') {
    // Try to detect from common patterns
    if (code.includes('package ') || code.includes('import java.') || code.includes('public class')) {
      return 'java';
    }
    if (code.includes('function') || code.includes('=>') || code.includes('const ')) {
      return 'javascript';
    }
    if (code.includes('def ') || code.includes('import ') && code.includes('python')) {
      return 'python';
    }
    if (code.includes('<?php')) {
      return 'php';
    }
    if (code.includes('interface ') || code.includes('class ') && code.includes(': ')) {
      return 'typescript';
    }
    if (code.includes('SELECT ') || code.includes('FROM ') || code.includes('INSERT ')) {
      return 'sql';
    }
    if (code.includes('<html') || code.includes('<div') || code.includes('</')) {
      return 'html';
    }
    if (code.includes('{') && code.includes('}') && code.includes(':')) {
      return 'json';
    }
  }
  
  if (category === 'CONFIGURATION') {
    if (code.includes('version:') || code.includes('services:')) {
      return 'yaml';
    }
    if (code.includes('{') && code.includes('}')) {
      return 'json';
    }
    return 'bash';
  }
  
  // Default to plain text for documentation
  return 'plaintext';
};

// Token types for syntax highlighting
const tokenize = (line: string, language: string) => {
  const tokens = [];
  
  if (language === 'java') {
    // Java keywords
    const javaKeywords = /\b(package|import|public|private|protected|class|interface|extends|implements|static|final|void|int|long|double|float|boolean|char|byte|short|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|throws|new|this|super)\b/g;
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
    const annotations = /@\w+/g;
    
    let lastIndex = 0;
    const allMatches = [];
    
    // Find all strings
    let match;
    while ((match = strings.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
    }
    
    // Find all keywords
    while ((match = javaKeywords.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] });
    }
    
    // Find all annotations
    while ((match = annotations.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'annotation', text: match[0] });
    }
    
    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Build tokens
    lastIndex = 0;
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        tokens.push({ type: 'text', text: line.substring(lastIndex, match.start) });
      }
      tokens.push({ type: match.type, text: match.text });
      lastIndex = match.end;
    }
    if (lastIndex < line.length) {
      tokens.push({ type: 'text', text: line.substring(lastIndex) });
    }
  } else if (language === 'javascript' || language === 'typescript') {
    // JavaScript keywords
    const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|async|await|new|this|typeof|instanceof|try|catch|finally|throw)\b/g;
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/)/g;
    
    let lastIndex = 0;
    const allMatches = [];
    
    // Find all strings
    let match;
    while ((match = strings.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
    }
    
    // Find all keywords
    while ((match = jsKeywords.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] });
    }
    
    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Build tokens
    lastIndex = 0;
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        tokens.push({ type: 'text', text: line.substring(lastIndex, match.start) });
      }
      tokens.push({ type: match.type, text: match.text });
      lastIndex = match.end;
    }
    if (lastIndex < line.length) {
      tokens.push({ type: 'text', text: line.substring(lastIndex) });
    }
  } else if (language === 'python') {
    // Python keywords
    const pyKeywords = /\b(def|class|import|from|return|if|elif|else|for|while|with|as|try|except|finally|lambda|pass|break|continue|and|or|not|in|is|True|False|None)\b/g;
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|"""[\s\S]*?"""|'''[\s\S]*?''')/g;
    const comments = /#.*/g;
    
    let lastIndex = 0;
    const allMatches = [];
    
    // Find all strings
    let match;
    while ((match = strings.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
    }
    
    // Find all comments
    while ((match = comments.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'comment', text: match[0] });
    }
    
    // Find all keywords
    while ((match = pyKeywords.exec(line)) !== null) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] });
    }
    
    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Build tokens
    lastIndex = 0;
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        tokens.push({ type: 'text', text: line.substring(lastIndex, match.start) });
      }
      tokens.push({ type: match.type, text: match.text });
      lastIndex = match.end;
    }
    if (lastIndex < line.length) {
      tokens.push({ type: 'text', text: line.substring(lastIndex) });
    }
  } else {
    // Default - no highlighting
    tokens.push({ type: 'text', text: line });
  }
  
  return tokens;
};

const renderTokens = (tokens: any[], lineIndex: number) => {
  return (
    <Text key={lineIndex} style={styles.codeLine}>
      <Text style={styles.lineNumber}>{String(lineIndex + 1).padStart(3, ' ')}  </Text>
      {tokens.map((token, i) => {
        let style = styles.codeText;
        switch (token.type) {
          case 'keyword':
            style = styles.keyword;
            break;
          case 'string':
            style = styles.string;
            break;
          case 'comment':
            style = styles.comment;
            break;
          case 'annotation':
            style = styles.annotation;
            break;
          case 'number':
            style = styles.number;
            break;
          default:
            style = styles.codeText;
        }
        return <Text key={i} style={style}>{token.text}</Text>;
      })}
    </Text>
  );
};

export default function SyntaxHighlight({ code, language, category }: SyntaxHighlightProps) {
  const detectedLanguage = language || detectLanguage(code, category);
  
  // For plain text or documentation, just return styled text
  if (detectedLanguage === 'plaintext' || category === 'DOCUMENTATION') {
    return (
      <View style={styles.plainTextContainer}>
        <Text style={styles.plainText}>{code}</Text>
      </View>
    );
  }
  
  const lines = code.split('\n');
  
  return (
    <View style={styles.container}>
      <View style={styles.languageHeader}>
        <Text style={styles.languageLabel}>{detectedLanguage}</Text>
      </View>
      <ScrollView 
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        style={styles.codeScrollViewHorizontal}
      >
        <ScrollView
          style={styles.codeScrollViewVertical}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.codeContainer}>
            {lines.map((line, lineIndex) => {
              const tokens = tokenize(line, detectedLanguage);
              return renderTokens(tokens, lineIndex);
            })}
          </View>
        </ScrollView>
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  languageLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  codeScrollViewHorizontal: {
    flex: 1,
  },
  codeScrollViewVertical: {
    maxHeight: 350,
  },
  codeContainer: {
    padding: 12,
    minWidth: '100%',
  },
  codeLine: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
    color: '#d4d4d4',
    minWidth: 800, // Ensure lines are wide enough
  },
  lineNumber: {
    color: '#6e7681',
    fontSize: 12,
    minWidth: 35,
  },
  codeText: {
    color: '#d4d4d4',
  },
  keyword: {
    color: '#c586c0',
    fontWeight: '600',
  },
  string: {
    color: '#ce9178',
  },
  number: {
    color: '#b5cea8',
  },
  comment: {
    color: '#6a9955',
    fontStyle: 'italic',
  },
  annotation: {
    color: '#dcdcaa',
  },
  constant: {
    color: '#4fc1ff',
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