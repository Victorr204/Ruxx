import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { account } from "../appwriteConfig";
import { saveTransaction } from "../utils/saveTransaction";
import { useTheme } from "../context/ThemeContext";

export default function BettingPage() {
  const { theme } = useTheme();

  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState(null);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [loading, setLoading] = useState(false);

  

  // 🔹 Fetch betting providers from Ebills
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch(
          "https://ruxx-paystack.vercel.app/api/ebills/plans?type=betting"
        );
        const data = await res.json();

        if (data.success && Array.isArray(data.items)) {
          setProviders(data.items);
        } else {
          Alert.alert("Error", "Failed to load betting providers.");
        }
      } catch (err) {
        console.error("❌ Failed to fetch providers:", err);
        Alert.alert("Error", "Could not fetch betting providers.");
      }
    };

    fetchProviders();
  }, []);

  const handleVerify = async () => {
    if (!provider || !customerId || !amount) {
      return Alert.alert("Missing Info", "Fill all fields first");
    }

    const amt = parseInt(amount);
    if (isNaN(amt) || amt <= 0) {
      return Alert.alert("Invalid Amount", "Enter a valid amount");
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://ruxx-paystack.vercel.app/api/ebills/verify-betting",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: provider.id,   
            customer_id: customerId, 
          }),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (!res.ok || data.error) {
        throw new Error(data.error || "Verification failed.");
      }

      setConfirmData({
        provider: provider.name,
        providerId: provider.id,
        customerId,
        amount: amt,
        fullName: data.fullName || "Unknown User",
        username: data.username || "",
      });

      setShowModal(true);
    } catch (err) {
      setLoading(false);
      Alert.alert("Verification Error", err.message);
    }
  };

  const confirmPayment = async () => {
    try {
      const user = await account.get();
      setLoading(true); 

      const res = await fetch(
        "https://ruxx-paystack.vercel.app/api/purchase",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service: "betting",
            userId: user.$id,
            provider: confirmData.providerId, // 🔹 send provider ID to backend
            customerId: confirmData.customerId,
            amount: confirmData.amount,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Betting top-up failed.");
      }

      await saveTransaction({
        userId: user.$id,
        serviceType: "Betting",
        recipient: confirmData.customerId,
        provider: confirmData.provider,
        amount: confirmData.amount,
        status: "Success",
      });

      setShowModal(false);
      Alert.alert(
        "Success",
        `₦${confirmData.amount} sent to ${confirmData.fullName}`
      );
    } catch (err) {
      console.error("Payment failed:", err);
      Alert.alert("Transaction Error", err.message);
    } finally {
    setLoading(false);               // stop spinner
  }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.bettingContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.bettingTitle, { color: theme.text }]}>
        Betting Wallet Top-Up
      </Text>

      {/* Providers */}
      <Text style={[styles.bettingLabel, { color: theme.label }]}>
        Select Provider
      </Text>
      <View style={styles.bettingRow}>
        {providers.length === 0 ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          providers.map((prov) => (
            <TouchableOpacity
              key={prov.id}
              onPress={() => setProvider(prov)}
              style={[
                styles.bettingProviderButton,
                {
                  backgroundColor:
                    provider?.id === prov.id ? theme.selectedBackground : theme.card,
                  borderColor:
                    provider?.id === prov.id ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    provider?.id === prov.id ? theme.buttonText : theme.text,
                  fontWeight: "bold",
                }}
              >
                {prov.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Customer ID */}
      <Text style={[styles.bettingLabel, { color: theme.label }]}>
        Customer ID / Wallet ID
      </Text>
      <TextInput
        value={customerId}
        onChangeText={setCustomerId}
        style={[
          styles.bettingInput,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.inputText,
          },
        ]}
        placeholder="e.g. 123456"
        placeholderTextColor={theme.placeholder}
        keyboardType="numeric"
      />

      {/* Amount */}
      <Text style={[styles.bettingLabel, { color: theme.label }]}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        style={[
          styles.bettingInput,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.border,
            color: theme.inputText,
          },
        ]}
        placeholder="₦"
        placeholderTextColor={theme.placeholder}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[
          styles.bettingProceedButton,
          { backgroundColor: theme.buttonBackground },
        ]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text
          style={[styles.bettingProceedText, { color: theme.buttonText, }]}
        >
          {loading ? "Verifying..." : "Verify and Continue"}
        </Text>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.bettingModalOverlay}>
          <View
            style={[
              styles.bettingModalBox,
              { backgroundColor: theme.card, borderColor: theme.primary },
            ]}
          >
            <Text
              style={[styles.bettingModalTitle, { color: theme.text }]}
            >
              Confirm Payment
            </Text>
            <Text style={[styles.bettingModalText, { color: theme.text }]}>
              Name: {confirmData?.fullName}
            </Text>
            {confirmData?.username ? (
              <Text style={[styles.bettingModalText, { color: theme.text }]}>
                Username: {confirmData.username}
              </Text>
            ) : null}
            <Text style={[styles.bettingModalText, { color: theme.text }]}>
              Provider: {confirmData?.provider}
            </Text>
            <Text style={[styles.bettingModalText, { color: theme.text }]}>
              Wallet ID: {confirmData?.customerId}
            </Text>
            <Text style={[styles.bettingModalText, { color: theme.text }]}>
              Amount: ₦{confirmData?.amount}
            </Text>
            <View style={styles.bettingModalActions}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[
                  styles.bettingCancelBtn,
                  { borderColor: theme.border },
                ]}
              >
                <Text
                  style={[styles.bettingCancelText, { color: theme.text }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
  onPress={confirmPayment}
  style={[
    styles.modalConfirm,
    {
      backgroundColor: theme.buttonBackground,
      opacity: loading ? 0.6 : 1,
    },
  ]}
  disabled={loading}
>
  {loading ? (
    <ActivityIndicator size="small" color={theme.buttonText} />
  ) : (
    <Text style={{ color: theme.buttonText }}>Confirm</Text>
  )}
</TouchableOpacity>


            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bettingContainer: {
    padding: 20,
    flexGrow: 1,
  },
  bettingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  bettingLabel: {
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "600",
  },
  bettingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bettingProviderButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  bettingInput: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  bettingProceedButton: {
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  bettingProceedText: {
    fontWeight: "bold",
  },
  bettingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  bettingModalBox: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  bettingModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  bettingModalText: {
    fontSize: 15,
    marginVertical: 2,
  },
  bettingModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  bettingCancelBtn: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  bettingConfirmBtn: {
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  bettingCancelText: {
    fontWeight: "bold",
  },
  bettingConfirmText: {
    fontWeight: "bold",
  },
});
