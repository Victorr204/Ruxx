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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Icon from 'react-native-vector-icons/Ionicons';
import { account, databases, Config, Query } from '../appwriteConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [alert, setAlertState] = useState({ message: '', type: '', visible: false });
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkForBiometricCredentials();
  }, []);

  useEffect(() => {
    const checkAppwriteSession = async () => {
      try {
        const user = await account.get(); // ✅ Check for active session

        if (!user.emailVerification) {
          console.log("User found but not verified. Staying on login.");
          Alert.alert(
            "Email Not Verified",
            "Please check your inbox and click the verification link before logging in."
          );
          return; // 🚫 Don't auto-login
        }

        console.log("Verified session found, redirecting...");
        router.replace("/ask-pin"); // 🚀 Auto redirect to dashboard
      } catch (_error) {
        console.log("No active session, staying on login.");
      }
    };

  // Run once immediately
  checkAppwriteSession();

  // 🔄 Refresh every 10s
  const interval = setInterval(checkAppwriteSession, 10000);

  // Cleanup on unmount
  return () => clearInterval(interval);
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
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();

  console.log("Session: active"); // Remove this in production

      if (!user.emailVerification) {
        await account.deleteSession('current');
        return showAlert("Please verify your email before logging in.", 'error');
      }

     await saveCredentials(email, password);

// Fetch user document
const userDocs = await databases.listDocuments(
  Config.databaseId,
  Config.userCollectionId,
  [Query.equal('userId', user.$id)]
);

if (!userDocs.total) throw new Error("User record not found");

    } catch (_error) {
      console.error("Login error:", _error);
      showAlert("Login Error: " + _error.message, 'error');
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

  await account.createEmailPasswordSession(savedEmail, savedPassword);
  const user = await account.get();

        if (!user.emailVerification) {
          await account.deleteSession('current');
          return showAlert("Verify your email before login.", 'error');
        }

        showAlert('Biometric login successful!', 'success');
        setTimeout(() => router.replace('/home'), 1000);
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

     <View style={styles.passwordContainer}>
       <TextInput
         placeholder="Password"
         value={password}
         onChangeText={setPassword}
         style={styles.passwordInput}
         secureTextEntry={!showPassword}
         placeholderTextColor="#000"
       />
       <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
         <Text style={styles.eyeIcon}>
           <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#000" />
     
         </Text>
       </TouchableOpacity>
     </View>
     

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
            color="black"
          />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.replace('/register')}>
        <Text style={styles.link}>Don&apos;t have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // neutral background for black text
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000", // black text
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#000", // black border
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#000", // black text
  },

  passwordContainer: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#000",
  borderRadius: 8,
  paddingHorizontal: 12,
  marginBottom: 15,
  backgroundColor: "#fff",
},
passwordInput: {
  flex: 1,
  paddingVertical: 12,
  color: "#000",
},
eyeIcon: {
  fontSize: 18,
  paddingHorizontal: 8,
  color: "#000",
},


  button: {
    backgroundColor: "#000", // black button
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
    backgroundColor: "#e0e0e0", // light gray to match neutral theme
    borderRadius: 50,
    alignSelf: "center",
    padding: 15,
    marginBottom: 20,
  },
  link: {
    textAlign: "center",
    color: "#000", // black link
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
    backgroundColor: '#000', // black for success (can change to green if you want color info)
  },
  error: {
    backgroundColor: '#222', // dark gray for error
  },
  info: {
    backgroundColor: '#444', // slightly lighter gray for info
  },
});
