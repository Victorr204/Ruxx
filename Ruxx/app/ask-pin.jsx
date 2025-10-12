// File: app/ask-pin.jsx

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../context/ThemeContext";

export default function AskPin() {
  const { userDocId } = useLocalSearchParams();
  const { theme } = useTheme(); // ✅ global theme

  const handleSetPin = () => {
    router.replace({ pathname: "/set-pin", params: { userDocId } });
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("skipPinSetup", "true");
    router.replace("/home");
  };

  return (
    <View
      style={[
        styles.askPinContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <View
        style={[
          styles.askPinCard,
          { backgroundColor: theme.card, shadowColor: theme.shadow },
        ]}
      >
        <Text style={[styles.askPinTitle, { color: theme.text }]}>
          Secure Your Account
        </Text>
        <Text style={[styles.askPinSubtitle, { color: theme.subtitle }]}>
          Do you want to add a 4-digit PIN for extra protection?
        </Text>

        <TouchableOpacity
          style={[styles.askPinButton, { backgroundColor: theme.primary }]}
          onPress={handleSetPin}
        >
          <Text style={[styles.askPinButtonText, { color: theme.buttonText }]}>
            Yes, Set PIN
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.askPinButton, styles.askPinSkip, { backgroundColor: theme.secondary }]}
          onPress={handleSkip}
        >
          <Text style={[styles.askPinButtonText, { color: theme.buttonText }]}>
            No, Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  askPinContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  askPinCard: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  askPinTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  askPinSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  askPinButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  askPinSkip: {
    opacity: 0.9,
  },
  askPinButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
