import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { account, databases, Query , Config } from "../appwriteConfig";
import { saveTransaction } from "../utils/saveTransaction";

import { useTheme } from "../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function AirtimePage() {
  const { theme } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("");
  const [plans, setPlans] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [previousNumbers, setPreviousNumbers] = useState([]);
  const [showNumbers, setShowNumbers] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [balanceDoc, setBalanceDoc] = useState(null);
  const [user, setUser] = useState(null);


   // NEW STATES
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadPreviousNumbers();
    fetchUser();
    fetchAirtimePlans();
  }, []);

  const fetchUser = async () => {
    try {
      const u = await account.get();
      setUser(u);
       // 👇 prefill with the phone stored at registration (adjust field name if different)
      if (u.phone) setPhoneNumber(u.phone);

      const res = await databases.listDocuments(
  Config.databaseId,
  Config.balanceCollectionId, // ✅ use correct collection ID
  [Query.equal("userId", u.$id), Query.limit(1)]
);


      if (res.documents.length > 0) {
        setBalanceDoc(res.documents[0]);
      } else {
        Alert.alert("Wallet Error", "Wallet balance not found.");
      }
    } catch (err) {
      console.error("User fetch failed:", err);
    }
  };

const fetchAirtimePlans = async () => {
  try {
    const res = await fetch(
      "https://ruxx-paystack.vercel.app/api/ebills/plans?type=airtime"
    );

    const text = await res.text();
    console.log("🔍 Raw API response:", text);

    let data;
    try {
          data = JSON.parse(text);
        } catch (_jsonErr) {
          console.error("⚠️ Invalid JSON from plans API:", text);
          alert("Invalid response from server. Please try again later.");
          return;
    }

    if (data.success) {
      if (Array.isArray(data.items) && data.items.length > 0) {
        setPlans(data.items);
      } else {
        console.warn("⚠️ No plans available:", data.message);
        alert(data.message || "No airtime plans available right now.");
      }
    } else {
      console.warn("❌ Failed to fetch plans:", data.error);
      alert(data.error || "Service temporarily unavailable.");
    }
  } catch (err) {
    console.error("Airtime plans error:", err);
    alert("Network error. Please check your internet and try again.");
  }
};



  const loadPreviousNumbers = async () => {
    const stored = await AsyncStorage.getItem("airtime_numbers");
    if (stored) setPreviousNumbers(JSON.parse(stored));
  };

  const savePhoneNumber = async (number) => {
    let updatedList = [number, ...previousNumbers.filter((n) => n !== number)];
    if (updatedList.length > 5) updatedList = updatedList.slice(0, 5);
    await AsyncStorage.setItem("airtime_numbers", JSON.stringify(updatedList));
    setPreviousNumbers(updatedList);
  };

  const removeSavedNumber = async (number) => {
    try {
      const updated = previousNumbers.filter((n) => n !== number);
      await AsyncStorage.setItem("airtime_numbers", JSON.stringify(updated));
      setPreviousNumbers(updated);
    } catch (err) {
      console.error("Failed to remove saved number:", err);
    }
  };

  

  const handlePay = () => {
    const amount = selectedAmount || parseInt(customAmount);

    if (!phoneNumber || !network || !amount || isNaN(amount) || amount <= 0) {
      return Alert.alert("Invalid Input", "Please enter all details correctly.");
    }

    if (balanceDoc?.wallet < amount) {
      return Alert.alert(
        "Insufficient Balance",
        "You do not have enough wallet balance."
      );
    }

    setConfirmData({
      phoneNumber,
      network,
      amount,
    });

    setShowModal(true);
  };

    // Custom alert helper
  const showAlert = (title, message, type = "error") =>
    setAlertData({ visible: true, title, message, type });

const confirmPayment = async () => {
  setLoading(true);
  try {
    const response = await fetch(
      "https://ruxx-paystack.vercel.app/api/purchase",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "airtime",
          userId: user.$id,
          phone: confirmData.phoneNumber,
          provider: confirmData.network,
          amount: confirmData.amount,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error);

    await saveTransaction({
      userId: user.$id,
      serviceType: "Airtime",
      recipient: confirmData.phoneNumber,
      provider: confirmData.network,
      amount: confirmData.amount,
      status: "Success",
    });

    savePhoneNumber(confirmData.phoneNumber);

    if (
      result.newBalance !== undefined &&
      !Number.isNaN(Number(result.newBalance))
    ) {
      setBalanceDoc((prev) => ({
        ...prev,
        balance: Number(result.newBalance),
      }));
    }

    setShowModal(false);
    showAlert(
      "Success",
      `₦${confirmData.amount} airtime sent to ${confirmData.phoneNumber}`,
      "success"
    );
  } catch (err) {
    setShowModal(false);

    // 524-specific handling stays here
    if (err.message.includes("524")) {
      Alert.alert(
        "Server Timeout",
        "Our server took too long to respond. Please try again later."
      );
    } else {
      Alert.alert("Transaction Error", err.message || "Something went wrong");
    }

    showAlert("Transaction Error", err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};




  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.header, { color: theme.airtime }]}>Buy Airtime</Text>

        {/* Phone number input */}
        <Text style={[styles.label, { color: theme.label }]}>Phone Number</Text>
         <View style={{ position: "relative" }}>
            <TextInput
              placeholder="e.g. 08012345678"
              placeholderTextColor={theme.placeholder}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBackground,
                  color: theme.inputText,
                  borderColor: theme.border,
                  paddingRight: 40, // space for arrow
                },
              ]}
            />
             {/* Phone number dropdown */}
            {previousNumbers.length > 0 && (
              <TouchableOpacity
                style={styles.dropdownIcon}
                onPress={() => setShowNumbers((prev) => !prev)}
              >
                <Ionicons
                  name={showNumbers ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.text}
                />
              </TouchableOpacity>
            )}
          </View>

          {showNumbers && (
            <View style={[styles.dropdownList, { backgroundColor: theme.card, }]}>
              {previousNumbers.map((num) => (
                <View key={num} style={styles.dropdownRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setPhoneNumber(num);
                      setShowNumbers(false);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{num}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSavedNumber(num)}>
                    <Ionicons name="close" size={18} color={theme.subtitle} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

       {/* Networks */}
<Text style={[styles.label, { color: theme.label }]}>Network</Text>
<View style={styles.networkContainer}>
  {plans.map((provider) => (
    <TouchableOpacity
      key={provider.id}
      onPress={() => setNetwork(provider.id)}
      style={[
        styles.networkButton,
        {
          backgroundColor:
            network === provider.id
              ? theme.selectedBackground
              : theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text
        style={{
          color:
            network === provider.id ? theme.selectedText : theme.text,
          fontWeight: "600",
        }}
      >
        {provider.name}
      </Text>
    </TouchableOpacity>
  ))}
</View>


        {/* Amount selection */}
<Text style={[styles.label, { color: theme.label }]}>Select Amount</Text>
<View style={styles.amountGrid}>
  {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
    <TouchableOpacity
      key={amount} // ✅ unique key
      onPress={() => {
        setSelectedAmount(amount);
        setCustomAmount("");
      }}
      style={[
        styles.amountButton,
        {
          backgroundColor:
            selectedAmount === amount ? theme.selectedBackground : theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text
        style={{
          color: selectedAmount === amount ? theme.selectedText : theme.text,
          fontWeight: "bold",
        }}
      >
        ₦{amount}
      </Text>
    </TouchableOpacity>
  ))}
</View>

        {/* Custom amount */}
        <Text style={[styles.label, { color: theme.label }]}>
          Or Enter Custom Amount
        </Text>
        <TextInput
          placeholder="e.g. 750"
          placeholderTextColor={theme.placeholder}
          keyboardType="numeric"
          value={customAmount}
          onChangeText={(val) => {
            setCustomAmount(val);
            setSelectedAmount(null);
          }}
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.inputText,
              borderColor: theme.border,
            },
          ]}
        />

        {/* Pay button */}
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: theme.buttonBackground }]}
          onPress={handlePay}
        >
          <Text style={[styles.payButtonText, { color: theme.buttonText }]}>
            Proceed to Pay
          </Text>
        </TouchableOpacity>

        {/* Confirmation modal */} 
         <Modal visible={showModal} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
            <View
              style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.accent }]}
            >

              <>
  <Text style={[styles.modalTitle, { color: theme.text }]}>
    Confirm Payment
  </Text>
  <Text style={{ color: theme.text }}>Phone: {confirmData.phoneNumber}</Text>
  <Text style={{ color: theme.text }}>Network: {confirmData.network}</Text>
  <Text style={{ color: theme.text }}>Amount: ₦{confirmData.amount}</Text>

  <View style={styles.modalActions}>
    <TouchableOpacity
      onPress={() => setShowModal(false)}
      style={[styles.modalCancel, { borderColor: theme.accent }]}
      disabled={loading}
    >
      <Text style={{ color: theme.text }}>Cancel</Text>
    </TouchableOpacity>

    {/* ✅ Spinner INSIDE the Confirm button */}
    <TouchableOpacity
      onPress={confirmPayment}
      style={[
        styles.modalConfirm,
        { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 },
      ]}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={{ color: "#fff" }}>Confirm</Text>
      )}
    </TouchableOpacity>
  </View>
</>

            </View>
          </View>
        </Modal>
      </ScrollView>

       {/* ---------- Custom Alert ---------- */}
        {alertData.visible && (
          <View style={styles.alertOverlay}>
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor:
                    alertData.type === "success" ? "#22c55e" : "#ef4444",
                },
              ]}
            >
              <Text style={styles.alertTitle}>{alertData.title}</Text>
              <Text style={styles.alertMsg}>{alertData.message}</Text>
              <TouchableOpacity
                onPress={() =>
                  setAlertData((prev) => ({ ...prev, visible: false }))
                }
                style={styles.alertBtn}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
    safeArea: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

   dropdownIcon: {
    position: "absolute",
    right: 10,
    top: "30%",
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: -6,
    marginBottom: 10,
  },
  dropdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  row: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  networkContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  networkButton: {
    padding: 10,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  amountButton: {
    borderRadius: 10,
    padding: 10,
    width: "30%",
    alignItems: "center",
    borderWidth: 1,
  },
  payButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: { borderRadius: 10, padding: 20, width: "80%", borderWidth: 2 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalCancel: { padding: 10, borderRadius: 8, borderWidth: 1, marginRight: 10 },
  modalConfirm: { padding: 10, borderRadius: 8 },

  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  alertBox: {
    width: "75%",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  alertTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  alertMsg: { color: "#fff", fontSize: 15, textAlign: "center", marginBottom: 15 },
  alertBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
