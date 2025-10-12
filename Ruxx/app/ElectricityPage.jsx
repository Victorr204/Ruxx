import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
   ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveTransaction } from "../utils/saveTransaction";
import { account, databases, Config } from "../appwriteConfig";
import { Query } from "appwrite";
import { useTheme } from "../context/ThemeContext";

export default function ElectricityPage() {
  const [meterNumber, setMeterNumber] = useState("");
  const [selectedDisco, setSelectedDisco] = useState(null);
  const [selectedMeterType, setSelectedMeterType] = useState("");
  const [amount, setAmount] = useState("");
  const [previousMeters, setPreviousMeters] = useState([]);
  const [discoList, setDiscoList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [user, setUser] = useState(null);
  const [balanceDoc, setBalanceDoc] = useState(null);
  const lastVerified = useRef(null);
  const [meterName, setMeterName] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    loadPreviousMeters();
    fetchDiscos();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const u = await account.get();
      setUser(u);

      const res = await databases.listDocuments(Config.databaseId, Config.balanceCollectionId, [
        Query.equal("userId", u.$id),
        Query.limit(1),
      ]);

      if (res.documents.length > 0) {
        setBalanceDoc(res.documents[0]);
      } else {
        Alert.alert("Wallet Error", "Wallet balance not found.");
      }
    } catch (err) {
      console.error("User fetch failed:", err);
    }
  };

  const loadPreviousMeters = async () => {
    const stored = await AsyncStorage.getItem("electric_meters");
    if (stored) setPreviousMeters(JSON.parse(stored));
  };

  const fetchDiscos = async () => {
    try {
      const response = await fetch(
        "https://ruxx-paystack.vercel.app/api/ebills/plans?type=electricity"

      );
      
      const data = await response.json();
if (data.success && Array.isArray(data.items)) {
  setDiscoList(data.items);
}

    } catch (err) {
      console.log("Failed to fetch discos", err);
    }
  };

  const saveMeter = async (number) => {
    let updated = [number, ...previousMeters.filter((n) => n !== number)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    await AsyncStorage.setItem("electric_meters", JSON.stringify(updated));
    setPreviousMeters(updated);
  };

  const handlePay = () => {
    if (!meterNumber || !selectedDisco || !selectedMeterType || !amount || isNaN(amount)) {
      Alert.alert("Incomplete Info", "Please fill all fields correctly.");
      return;
    }
    setConfirmData({
      meterNumber,
      disco: selectedDisco.code,
      discoName: selectedDisco.name,
      meterType: selectedMeterType,
      meterName,
      amount,
    });
    setShowModal(true);
  };

  // Manual verification function (calls backend verify-customer)
  const handleVerifyMeter = useCallback(async () => {
    if (!meterNumber || !selectedDisco || !selectedMeterType) {
      return Alert.alert("Missing Info", "Enter meter number and select disco + meter type first");
    }

    try {
      setVerifying(true);
      const res = await fetch("https://ruxx-paystack.vercel.app/api/ebills/verify-betting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedDisco.id,
          customer_id: meterNumber,
          variation_id: selectedMeterType.toLowerCase(),
        }),
      });

      const data = await res.json();
      setVerifying(false);

      if (!res.ok || data.error) {
        throw new Error(data.error || "Verification failed.");
      }

      const name = data.fullName || data.username || data.customerId || null;
      setMeterName(name);
      if (!name) Alert.alert("Verified", "Meter verified but name not returned.");
    } catch (err) {
      setVerifying(false);
      console.error("Meter verify failed:", err);
      Alert.alert("Verification Error", err.message || "Failed to verify meter");
    }
  }, [meterNumber, selectedDisco, selectedMeterType]);

  // Auto-verify when meterNumber + disco + meterType are present (debounced)
  useEffect(() => {
    const shouldAuto = meterNumber && selectedDisco && selectedMeterType && meterNumber.length >= 5;
    if (!shouldAuto) return;

    const key = `${selectedDisco.id}|${selectedMeterType}|${meterNumber}`;
    // skip if we've already verified this exact combo
    if (lastVerified.current === key) return;

    const t = setTimeout(() => {
      handleVerifyMeter();
      lastVerified.current = key;
    }, 700);

    return () => clearTimeout(t);
  }, [meterNumber, selectedDisco, selectedMeterType, handleVerifyMeter]);
  
const confirmPayment = async () => {
  try {
    setLoading(true);                // start spinner
    const res = await fetch("https://ruxx-paystack.vercel.app/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: "electricity",
        userId: user.$id,
        meterNumber: confirmData.meterNumber,
        disco: confirmData.disco,
        meterType: confirmData.meterType.toLowerCase(),
        amount: parseInt(confirmData.amount),
      }),
    });

    const result = await res.json();
    if (!res.ok || result.error) {
      throw new Error(result.error || "Electricity purchase failed.");
    }

    await saveMeter(confirmData.meterNumber);
    await saveTransaction({
      userId: user.$id,
      serviceType: "Electricity",
      recipient: confirmData.meterNumber,
      provider: confirmData.discoName,
      amount: parseInt(confirmData.amount),
      status: "Success",
    });

    if (result.newBalance !== undefined) {
      setBalanceDoc({ ...balanceDoc, balance: result.newBalance });
    }

    setShowModal(false);
    Alert.alert(
      "Success",
      `₦${confirmData.amount} token sent to ${confirmData.meterNumber} (${confirmData.discoName})`
    );
  } catch (err) {
    Alert.alert("Transaction Failed", err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>
            Electricity Payment
          </Text>

          {/* Meter Number */}
          <Text style={[styles.label, { color: theme.text }]}>Meter Number</Text>
          <TextInput
            placeholder="e.g. 1234567890"
            placeholderTextColor={theme.placeholder}
            keyboardType="number-pad"
            value={meterNumber}
            onChangeText={setMeterNumber}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.inputText,
              },
            ]}
          />

          {/* Previous meters */}
          {previousMeters.length > 0 && (
            <View style={styles.previousList}>
              <Text style={[styles.previousLabel, { color: theme.text }]}>
                Previous Meters:
              </Text>
              {previousMeters.map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setMeterNumber(num)}
                  style={[
                    styles.previousItem,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <Text style={{ color: theme.text }}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Discos */}
          <Text style={[styles.label, { color: theme.text }]}>Select Disco</Text>
          <View style={styles.networkContainer}>
            {discoList.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setSelectedDisco(item);
                  setSelectedMeterType(""); // reset type
                }}
                style={[
                  styles.networkButton,
                  {
                    backgroundColor:
                      selectedDisco?.id === item.id
                        ? theme.selectedBackground
                        : theme.card,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      selectedDisco?.id === item.id
                        ? theme.selectedText
                        : theme.text,
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meter Types */}
          {selectedDisco && (
            <>
              <Text style={[styles.label, { color: theme.text }]}>
                Meter Type
              </Text>
              <View style={styles.networkContainer}>
                {["Prepaid", "Postpaid"].map((type) => (
  <TouchableOpacity
    key={type}
    onPress={() => setSelectedMeterType(type)}
    style={[
      styles.networkButton,
      {
        backgroundColor:
          selectedMeterType === type
            ? theme.selectedBackground
            : theme.card,
      },
    ]}
  >
    <Text
      style={{
        color:
          selectedMeterType === type
            ? theme.selectedText
            : theme.text,
      }}
    >
      {type}
    </Text>
  </TouchableOpacity>
))}

              </View>
              {/* Verify Meter UI - appears after disco + meter type selection */}
              {selectedMeterType ? (
                <View style={{ marginTop: 8, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={[styles.verifyButton, { backgroundColor: theme.buttonBackground }]}
                      onPress={handleVerifyMeter}
                      disabled={verifying}
                    >
                      {verifying ? (
                        <ActivityIndicator color={theme.buttonText} />
                      ) : (
                        <Text style={[styles.verifyButtonText, { color: theme.buttonText }]}>Verify Meter</Text>
                      )}
                    </TouchableOpacity>

                    {meterName ? (
                      <Text style={{ marginLeft: 12, color: theme.text }}>Customer: {meterName}</Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </>
          )}

          {/* Amount */}
          <Text style={[styles.label, { color: theme.text }]}>Amount (₦)</Text>
          <TextInput
            placeholder="e.g. 5000"
            placeholderTextColor={theme.placeholder}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.border,
                color: theme.inputText,
              },
            ]}
          />

          {/* Pay */}
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: theme.buttonBackground }]}
            onPress={handlePay}
          >
            <Text style={[styles.payButtonText, { color: theme.buttonText }]}>
              Proceed to Pay
            </Text>
          </TouchableOpacity>

          {/* Confirmation Modal */}
          <Modal visible={showModal} transparent animationType="fade">
            <View
              style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
            >
              <View
                style={[
                  styles.modalBox,
                  { backgroundColor: theme.modalBg, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Confirm Payment
                </Text>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Meter: {confirmData.meterNumber}
                </Text>
                {confirmData.meterName ? (
                  <Text style={[styles.modalText, { color: theme.text }]}>Customer: {confirmData.meterName}</Text>
                ) : null}
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Disco: {confirmData.discoName}
                </Text>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Type: {confirmData.meterType}
                </Text>
                <Text style={[styles.modalText, { color: theme.text }]}>
                  Amount: ₦{confirmData.amount}
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    style={[
                      styles.modalCancel,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.inputBackground,
                      },
                    ]}
                  >
                    <Text style={{ color: theme.text }}>Cancel</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  label: { fontSize: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  previousList: { marginBottom: 10 },
  previousLabel: { fontSize: 14, marginBottom: 4 },
  previousItem: {
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  networkContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  networkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  payButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  payButtonText: { fontSize: 16, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: { fontSize: 16, marginBottom: 6 },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalCancel: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalConfirm: { padding: 10, borderRadius: 8 },
});
