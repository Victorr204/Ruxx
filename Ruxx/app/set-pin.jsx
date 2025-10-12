import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { databases, account, Config } from "../appwriteConfig";
import { router, useLocalSearchParams } from "expo-router";
import { Query } from "appwrite";
import { useTheme } from "../context/ThemeContext";
import * as LocalAuthentication from "expo-local-authentication";

export default function SetPin() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [docId, setDocId] = useState(null);
  const { userDocId } = useLocalSearchParams();
  const { theme } = useTheme();

  useEffect(() => {
    const getUserDocId = async () => {
      try {
        if (userDocId) {
          setDocId(userDocId);
        } else {
          const user = await account.get();
          const docs = await databases.listDocuments(
            Config.databaseId,
            Config.userCollectionId,
            [Query.equal("userId", user.$id)]
          );

          if (!docs.total) throw new Error("User not found");
          setDocId(docs.documents[0].$id);
        }
      } catch (error) {
        console.error("Error loading user doc:", error.message);
        Alert.alert("Error", "Couldn't find user record.");
        router.replace("/login");
      }
    };

    getUserDocId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 const handleSetPin = async () => {
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return Alert.alert("Invalid PIN", "PIN must be exactly 4 digits");
  }

  setLoading(true);
  try {
    if (!docId) throw new Error("User document ID not available");

    // 1. Save the PIN first
    await databases.updateDocument(
      Config.databaseId,
      Config.userCollectionId,
      docId,
      { pin }
    );

    // 2. Check if biometric is available
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (compatible && enrolled) {
      // Try biometric immediately
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          Platform.OS === "ios"
            ? "Confirm with Face ID"
            : "Confirm with Fingerprint",
        fallbackLabel: "Enter PIN",
      });

      if (result.success) {
        await databases.updateDocument(
          Config.databaseId,
          Config.userCollectionId,
          docId,
          { useBiometric: true }
        );
        Alert.alert("Success", "PIN and biometric login enabled.");
      } else {
        Alert.alert("PIN saved", "Biometric setup skipped.");
      }
    } else {
      Alert.alert("PIN saved", "Biometric not available on this device.");
    }

    // 3. Always navigate to verify pin
    router.replace("/verify-pin");
  } catch (error) {
    console.error("Set PIN error:", error.message);
    Alert.alert("Error", "Failed to save PIN.");
  } finally {
    setLoading(false);
  }
};



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[
        styles.setPinContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <View
        style={[
          styles.setPinCard,
          { backgroundColor: theme.card, shadowColor: theme.shadow },
        ]}
      >
        <Text style={[styles.setPinTitle, { color: theme.text }]}>
          Set Your 4-digit PIN
        </Text>

        <TextInput
          style={[
            styles.setPinInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.inputText,
              borderColor: theme.border,
            },
          ]}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={pin}
          onChangeText={setPin}
          placeholder="Enter 4-digit PIN"
          placeholderTextColor={theme.placeholder}
        />

        <TouchableOpacity
          style={[
            styles.setPinButton,
            { backgroundColor: theme.primary },
          ]}
          onPress={handleSetPin}
          disabled={loading}
        >
          <Text
            style={[
              styles.setPinButtonText,
              { color: theme.buttonText },
            ]}
          >
            {loading ? "Saving..." : "Save PIN"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  setPinContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  setPinCard: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  setPinTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  setPinInput: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
    fontSize: 18,
    textAlign: "center",
  },
  setPinButton: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  setPinButtonText: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
