import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/Ionicons';
import { account } from '../appwriteConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [alert, setAlertState] = useState({ message: '', type: '', visible: false });
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkForBiometricCredentials();
  }, []);

  const showAlert = (message, type = 'info') => {
    setAlertState({ message, type, visible: true });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setAlertState({ message: '', type: '', visible: false }));
      }, 3000);
    });
  };

  const checkForBiometricCredentials = async () => {
    const storedEmail = await SecureStore.getItemAsync('email');
    const storedPassword = await SecureStore.getItemAsync('password');
    if (storedEmail && storedPassword) {
      setBiometricEnabled(true);
    }
  };

  const saveCredentials = async (email, password) => {
    await SecureStore.setItemAsync('email', email);
    await SecureStore.setItemAsync('password', password);
    setBiometricEnabled(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return showAlert("Please enter both email and password.", 'error');
    }

    setLoading(true);
    try {
      const session = await account.createEmailPasswordSession(email, password);
      const user = await account.get();

      console.log("Session:", session); // Remove this in production

      if (!user.emailVerification) {
        await account.deleteSession('current');
        return showAlert("Please verify your email before logging in.", 'error');
      }

      await saveCredentials(email, password);
      showAlert('Login successful!', 'success');
      setTimeout(() => router.replace('/dashboard'), 1000);
    } catch (error) {
      console.error("Login error:", error);
      showAlert("Login Error: " + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return showAlert('Please enter your email to reset your password.', 'error');

    try {
      await account.createRecovery(email.trim(), 'https://your-app-url.com/recovery'); // Replace with your actual link
      showAlert('A reset link has been sent to your email.', 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      showAlert('Unable to send reset email. Try again.', 'error');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return showAlert('Set up Face ID / Fingerprint first.', 'info');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with Face ID / Fingerprint',
        fallbackLabel: 'Enter Passcode',
      });

      if (result.success) {
        const savedEmail = await SecureStore.getItemAsync('email');
        const savedPassword = await SecureStore.getItemAsync('password');

        if (!savedEmail || !savedPassword) {
          return showAlert('Saved credentials not found.', 'error');
        }

        const session = await account.createEmailPasswordSession(savedEmail, savedPassword);
        const user = await account.get();

        if (!user.emailVerification) {
          await account.deleteSession('current');
          return showAlert("Verify your email before login.", 'error');
        }

        showAlert('Biometric login successful!', 'success');
        setTimeout(() => router.replace('/dashboard'), 1000);
      } else {
        showAlert('Biometric authentication failed.', 'error');
      }
    } catch (error) {
      console.error('Biometric Error:', error);
      showAlert('Biometric authentication failed.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      {alert.visible && (
        <Animated.View style={[styles.alertBox, styles[alert.type], { opacity: fadeAnim }]}>
          <Text style={styles.alertText}>{alert.message}</Text>
        </Animated.View>
      )}

      <Text style={styles.title}>Sign In</Text>

      <TextInput
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
        placeholderTextColor="#666"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#666"
      />

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={[styles.link, { marginBottom: 10 }]}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      {biometricEnabled && (
        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
          <Icon
            name={Platform.OS === 'ios' ? 'ios-face-id' : 'finger-print'}
            size={30}
            color="green"
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.replace('/register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "green",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "green",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#111",
  },
  button: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: "bold",
    color: "#fff",
  },
  biometricButton: {
    backgroundColor: "#e6fce6",
    borderRadius: 50,
    alignSelf: "center",
    padding: 15,
    marginBottom: 20,
  },
  link: {
    textAlign: "center",
    color: "green",
    textDecorationLine: "underline",
  },
  alertBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
  },
  alertText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#22c55e',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
});
