import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import authService from '../services/auth.service';
import colors from '../styles/colors';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [emailSent, setEmailSent] = useState('');

  const handleSendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.sendMagicLink(email, false);
      if (result.success) {
        setEmailSent(email);
        setShowVerification(true);
        Alert.alert(
          'Check Your Email',
          'We sent a magic link and verification code to your email. Enter the 6-digit code below.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to send magic link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyMagicCode(emailSent, verificationCode);
      if (result.success && result.user) {
        onAuthSuccess(result.user);
      } else {
        Alert.alert('Error', result.message || 'Invalid or expired code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowVerification(false);
    setVerificationCode('');
    setEmailSent('');
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const result = await authService.sendMagicLink(emailSent, false);
      if (result.success) {
        Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
      } else {
        Alert.alert('Error', result.message || 'Failed to resend code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🌌</Text>
            <Text style={styles.title}>CosmicSpace</Text>
            <Text style={styles.subtitle}>Your Universe of Projects</Text>
          </View>

          {!showVerification ? (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Sign In / Sign Up</Text>
              <Text style={styles.formSubtitle}>
                Enter your email to receive a magic link
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.text.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendMagicLink}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.accent.nebula, colors.accent.stellar]}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Send Magic Link</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Enter Verification Code</Text>
              <Text style={styles.formSubtitle}>
                We sent a 6-digit code to {emailSent}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={colors.text.secondary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!isLoading}
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.accent.nebula, colors.accent.stellar]}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
                  <Text style={styles.linkText}>Resend Code</Text>
                </TouchableOpacity>
                <Text style={styles.separator}>•</Text>
                <TouchableOpacity onPress={handleBack} disabled={isLoading}>
                  <Text style={styles.linkText}>Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    color: colors.accent.stellar,
    fontSize: 14,
  },
  separator: {
    color: colors.text.secondary,
    marginHorizontal: 12,
  },
});

export default AuthScreen;