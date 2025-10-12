// File: app/verify-pin.jsx
import { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { databases, account, Config } from "../appwriteConfig";
import { router } from "expo-router";
import { Query } from "appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";
import * as LocalAuthentication from "expo-local-authentication";

export default function VerifyPin() {
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState("");
  const [useBiometric, setUseBiometric] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        const user = await account.get();
        const docs = await databases.listDocuments(
          Config.databaseId,
          Config.userCollectionId,
          [Query.equal("userId", user.$id)]
        );

        if (docs.total) {
          const userDoc = docs.documents[0];
          setStoredPin(userDoc.pin);
          setUseBiometric(userDoc.useBiometric || false);

          // ✅ If biometric is enabled, try immediately
          if (userDoc.useBiometric) {
            triggerBiometric();
          }
        }
      } catch (_err) {
        Alert.alert("Error", "Failed to load security settings.");
      }
    };

    fetchUserSettings();
  }, []);

  const triggerBiometric = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) return; // fallback to PIN

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          Platform.OS === "ios" ? "Unlock with Face ID" : "Unlock with Fingerprint",
        fallbackLabel: "Enter PIN",
      });

      if (result.success) {
        await AsyncStorage.setItem("pinVerified", "true");
        router.replace("/home");
      }
    } catch (err) {
      console.log("Biometric auth failed:", err.message);
    }
  };

  const handleVerify = async () => {
    if (pin === storedPin) {
      await AsyncStorage.setItem("pinVerified", "true");
      router.replace("/home");
    } else {
      Alert.alert("Incorrect PIN");
    }
  };

  return (
    <View
      style={[
        styles.verifyPinContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <View
        style={[
          styles.verifyPinCard,
          { backgroundColor: theme.card, shadowColor: theme.shadow },
        ]}
      >
        <Text style={[styles.verifyPinTitle, { color: theme.text }]}>
          {useBiometric ? "Or Enter PIN" : "Enter PIN"}
        </Text>

        <TextInput
          style={[
            styles.verifyPinInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.inputText,
            },
          ]}
          keyboardType="numeric"
          maxLength={4}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          placeholder="Enter your 4-digit PIN"
          placeholderTextColor={theme.placeholder}
        />

        <TouchableOpacity
          style={[styles.verifyPinButton, { backgroundColor: theme.primary }]}
          onPress={handleVerify}
        >
          <Text
            style={[
              styles.verifyPinButtonText,
              { color: theme.buttonText },
            ]}
          >
            Verify
          </Text>
        </TouchableOpacity>

        {useBiometric && (
          <TouchableOpacity
            style={[styles.verifyPinButton, { marginTop: 10, backgroundColor: theme.primary }]}
            onPress={triggerBiometric}
          >
            <Text style={[styles.verifyPinButtonText, { color: theme.buttonText }]}>
              Use {Platform.OS === "ios" ? "Face ID" : "Fingerprint"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verifyPinContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  verifyPinCard: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyPinTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  verifyPinInput: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 18,
    textAlign: "center",
  },
  verifyPinButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  verifyPinButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
