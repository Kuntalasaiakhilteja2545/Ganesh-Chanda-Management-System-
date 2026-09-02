import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  // Mode: 'login' | 'forgotPassword' | 'forgotUsername'
  const [mode, setMode] = useState('login');

  // Forgot password sub-step: 'verify' | 'reset'
  const [forgotStep, setForgotStep] = useState('verify');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Forgot fields
  const [forgotUsernameField, setForgotUsernameField] = useState('');
  const [forgotMobile, setForgotMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveredUsername, setRecoveredUsername] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login, forgotUsername, resetPassword, loading } = useAuth();

  const handleLogin = async () => {
    setError('');
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Invalid username or password.'
      );
    }
  };

  const handleForgotUsername = async () => {
    setError('');
    setSuccessMsg('');
    setRecoveredUsername('');

    if (!forgotMobile.trim()) {
      setError('Mobile number is required.');
      return;
    }

    try {
      const data = await forgotUsername(forgotMobile.trim());
      setRecoveredUsername(data.username);
      setSuccessMsg(`Your username is: ${data.username}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'No account found with this mobile number.'
      );
    }
  };

  const handleVerifyIdentity = () => {
    setError('');
    if (!forgotUsernameField.trim() || !forgotMobile.trim()) {
      setError('Both username and mobile number are required.');
      return;
    }
    setForgotStep('reset');
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await resetPassword(
        forgotUsernameField.trim(),
        forgotMobile.trim(),
        newPassword
      );
      setSuccessMsg('✓ Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setMode('login');
        setUsername(forgotUsernameField.trim());
        setPassword('');
        setSuccessMsg('');
        setForgotStep('verify');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Reset failed. Please check your details.'
      );
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setSuccessMsg('');
    setForgotStep('verify');
    setRecoveredUsername('');
  };

  // ─── LOGIN MODE ───
  if (mode === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <View style={styles.header}>
            <Text style={styles.om}>🕉️</Text>
            <Text style={styles.title}>Ganesh Chanda</Text>
            <Text style={styles.subtitle}>Collector Mobile App</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Enter your username"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password / Username Links */}
            <View style={styles.forgotRow}>
              <TouchableOpacity
                onPress={() => {
                  setMode('forgotPassword');
                  setError('');
                  setSuccessMsg('');
                  setForgotStep('verify');
                }}
              >
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMode('forgotUsername');
                  setError('');
                  setSuccessMsg('');
                  setRecoveredUsername('');
                  setForgotMobile('');
                }}
              >
                <Text style={styles.forgotLink}>Forgot Username?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── FORGOT USERNAME MODE ───
  if (mode === 'forgotUsername') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inner}
        >
          <ScrollView contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.om}>👤</Text>
              <Text style={styles.title}>Find Username</Text>
              <Text style={styles.subtitle}>Enter your registered mobile number</Text>
            </View>

            <View style={styles.card}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

              <Text style={styles.label}>Registered Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={forgotMobile}
                onChangeText={setForgotMobile}
                keyboardType="phone-pad"
                placeholder="e.g. 9876543210"
                placeholderTextColor="#94a3b8"
              />

              {recoveredUsername ? (
                <View style={styles.usernameBox}>
                  <Text style={styles.usernameLabel}>Your Username</Text>
                  <Text style={styles.usernameValue}>{recoveredUsername}</Text>
                  <Text style={styles.usernameHint}>(Partially masked for security)</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.button}
                onPress={handleForgotUsername}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Find My Username</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={switchToLogin} style={styles.backButton}>
                <Text style={styles.backText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── FORGOT PASSWORD MODE ───
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <ScrollView contentContainerStyle={styles.scrollInner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.om}>🔑</Text>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {forgotStep === 'verify'
                ? 'Verify your identity first'
                : 'Set your new password'}
            </Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

            {forgotStep === 'verify' ? (
              <>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={forgotUsernameField}
                  onChangeText={setForgotUsernameField}
                  autoCapitalize="none"
                  placeholder="Enter your username"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>Registered Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  value={forgotMobile}
                  onChangeText={setForgotMobile}
                  keyboardType="phone-pad"
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleVerifyIdentity}
                >
                  <Text style={styles.buttonText}>Next → Set New Password</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.identityBadge}>
                  <Text style={styles.identityText}>
                    Identity: {forgotUsernameField} • {forgotMobile}
                  </Text>
                  <TouchableOpacity onPress={() => { setForgotStep('verify'); setError(''); setSuccessMsg(''); }}>
                    <Text style={styles.changeLink}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                />

                {newPassword && confirmPassword && newPassword !== confirmPassword ? (
                  <Text style={styles.mismatchText}>Passwords do not match</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity onPress={switchToLogin} style={styles.backButton}>
              <Text style={styles.backText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollInner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  om: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#fbbf24',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    color: '#b91c1c',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    marginBottom: 8,
  },
  successText: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    color: '#065f46',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  forgotLink: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '700',
  },
  usernameBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  usernameLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  usernameValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#d97706',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3,
    marginTop: 4,
  },
  usernameHint: {
    fontSize: 10,
    color: '#b45309',
    marginTop: 4,
  },
  identityBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  identityText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  changeLink: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  mismatchText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
