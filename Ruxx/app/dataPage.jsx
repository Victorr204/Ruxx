// File: DataPage.jsx (replace your current file)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { account, databases, Config, Query } from "../appwriteConfig";
import { saveTransaction } from "../utils/saveTransaction";
import { useTheme } from "../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; 

export default function DataPage() {
  const { theme } = useTheme();

  const [loading, setLoading] = useState(false);

  // dynamic providers from API
  const [providers, setProviders] = useState([]);
  const [rawItems, setRawItems] = useState([]); // raw API items

  const [phoneNumber, setPhoneNumber] = useState("");
  const [defaultNumber, setDefaultNumber] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [network, setNetwork] = useState(""); // selected provider id (service_id)
  const [plansByCategory, setPlansByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [previousNumbers, setPreviousNumbers] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [balanceDoc, setBalanceDoc] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadPreviousNumbers();
    fetchUser();
    fetchAllPlans(); // fetch variations and providers once on mount
  }, []);

   
   
   
   
  useEffect(() => {
    if (network) buildPlansForProvider(network);
  }, [network, rawItems]);

  async function fetchUser() {
    try {
      const u = await account.get();
      setUser(u);

       // set default phone (from user prefs or phone attribute if you store it there)
       const defaultPhone =
        u.phone || u.phoneNumber || u.prefs?.phone || u.prefs?.defaultNumber || "";
     
      setDefaultNumber(defaultPhone);
      if (defaultPhone) setPhoneNumber(defaultPhone);



      const res = await databases.listDocuments(
        Config.databaseId,
        Config.balanceCollectionId,
        [Query.equal("userId", u.$id), Query.limit(1)]
      );

      if (res.documents.length > 0) {
        setBalanceDoc(res.documents[0]);
      } else {
        // don't block UI — just inform
        Alert.alert("Wallet Error", "Wallet balance not found.");
      }
    } catch (err) {
      console.error("User fetch failed:", err);
    }
  }

  const loadPreviousNumbers = async () => {
    try {
      const stored = await AsyncStorage.getItem("data_numbers");
      if (stored) setPreviousNumbers(JSON.parse(stored));
    } catch (err) {
      console.warn("Failed loading previous numbers:", err);
    }
  };

  const savePhoneNumber = async (number) => {
    let updated = [number, ...previousNumbers.filter((n) => n !== number)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    await AsyncStorage.setItem("data_numbers", JSON.stringify(updated));
    setPreviousNumbers(updated);
  };

  const removeSavedNumber = async (number) => {
    try {
      const updated = previousNumbers.filter((n) => n !== number);
      await AsyncStorage.setItem("data_numbers", JSON.stringify(updated));
      setPreviousNumbers(updated);
    } catch (err) {
      console.error("Failed to remove saved number:", err);
    }
  };

  // fetch all variations (data) and build provider list
  const fetchAllPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch(
        `https://ruxx-paystack.vercel.app/api/ebills/plans?type=data`
      );
      const json = await res.json();

      if (!json.success) {
        const errMsg = json.error || "Failed to fetch data variations";
        console.warn("Plans API:", errMsg);
        Alert.alert("Error", errMsg);
        setLoadingPlans(false);
        return;
      }

      const items = Array.isArray(json.items) ? json.items : [];
      setRawItems(items);

      // Build unique providers from items: { service_id, service_name }
      const map = new Map();
      items.forEach((it) => {
        const id = (it.service_id || it.service || "").toString().trim();
        const name = it.service_name || it.service || id;
        if (id && !map.has(id)) map.set(id, { id, name });
      });

      const providerList = Array.from(map.values());
      setProviders(providerList);

      // auto-select first provider if any
      if (providerList.length > 0) {
        setNetwork(providerList[0].id);
      }
    } catch (err) {
      console.error("fetchAllPlans error:", err);
      Alert.alert("Error", "Could not load data plans. Try again later.");
    } finally {
      setLoadingPlans(false);
    }
  };

  // build normalized plans for a specific provider id (service_id)
  const buildPlansForProvider = (providerId) => {
    if (!rawItems || rawItems.length === 0) {
      setPlansByCategory({});
      setSelectedCategory("");
      setSelectedPlan(null);
      return;
    }

    // filter strictly by service_id (case-insensitive)
    const filtered = rawItems.filter((it) =>
      (it.service_id || it.service || "")
        .toString()
        .toLowerCase()
        .trim()
        .startsWith(providerId.toString().toLowerCase().trim())
    );

    // If no exact matches, fallback to items that mention provider somewhere
    let effective = filtered;
    if (effective.length === 0) {
      effective = rawItems.filter((it) =>
        (it.service_name || "")
          .toString()
          .toLowerCase()
          .includes(providerId.toString().toLowerCase())
      );
    }

    // Normalize each plan item to a consistent front-end shape
    const normalized = effective.map((it) => {
      const rawLabel = it.data_plan || it.package_bouquet || it.name || "";
      // get validity by splitting " - " if present
      const validityCandidate =
        typeof rawLabel === "string" && rawLabel.includes(" - ")
          ? rawLabel.split(" - ").pop()
          : it.validity || it.duration || "N/A";

      return {
        id: it.variation_id?.toString() || `${it.variation_id}`,
        label: rawLabel,
        price:
          typeof it.price === "number"
            ? it.price
            : Number(String(it.price || "0").replace(/[^0-9.]/g, "")) || 0,
        validity: validityCandidate,
        code: it.variation_id, // send this to /purchase as productId
        availability: it.availability || "Available",
        raw: it,
      };
    });

    // Group by validity (Daily / Weekly / Monthly / Other)
// Group by validity (Daily / Weekly / Monthly / Other)
const grouped = normalized.reduce((acc, plan) => {
  const v = (plan.validity || "").toLowerCase();

  let cat = "Other";

  // Try to extract number of days if present
  const dayMatch = v.match(/(\d+)\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);

    if (days <= 3) cat = "Daily";
    else if (days === 7 || days === 14) cat = "Weekly";
    else if (days >= 28) cat = "Monthly";
    else cat = "Other";
  } else if (v.includes("week")) {
    cat = "Weekly";
  } else if (v.includes("month")) {
    cat = "Monthly";
  }

  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(plan);
  return acc;
}, {});


    setPlansByCategory(grouped);
    const keys = Object.keys(grouped);
    setSelectedCategory(keys[0] || "");
    setSelectedPlan(null);
  };

  const getCurrentPlans = () => plansByCategory[selectedCategory] || [];

  const handleProviderPress = (providerId) => {
    setNetwork(providerId);
    // buildPlansForProvider will run automatically via useEffect (network change)
  };

  const handlePay = () => {
    const amount = selectedPlan?.price;
    if (!phoneNumber || !network || !amount) {
      Alert.alert("Missing Information", "Please fill all fields before proceeding.");
      return;
    }

    const providerName = providers.find((p) => p.id === network)?.name || network;

    setConfirmData({
      phoneNumber,
      network: providerName,
      amount,
      plan: selectedPlan?.label,
      validity: selectedPlan?.validity,
      planCode: selectedPlan?.code,
    });
    setShowModal(true);
  };

 const confirmPayment = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in to continue.");
      return;
    }
    setLoading(true); // 🔑 show spinner
    try {
      const body = {
        service: "data",
        userId: user.$id,
        phone: confirmData.phoneNumber,
        provider: network,
        amount: confirmData.amount,
        productId: confirmData.planCode,
      };

      const res = await fetch("https://ruxx-paystack.vercel.app/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Data purchase failed.");

      await saveTransaction({
        userId: user.$id,
        serviceType: "Data",
        recipient: confirmData.phoneNumber,
        provider: providers.find((p) => p.id === network)?.name || network,
        amount: confirmData.amount,
        status: "Success",
      });

      savePhoneNumber(confirmData.phoneNumber);

      if (result.newBalance !== undefined) {
        const doc = { ...(balanceDoc || {}) };
        doc.balance = result.newBalance;
        setBalanceDoc(doc);
      }

      setShowModal(false);
      Alert.alert(
        "Success",
        `${confirmData.plan} (${confirmData.validity}) sent to ${confirmData.phoneNumber}`
      );
    } catch (err) {
      console.error("Payment failed:", err);
      Alert.alert("Transaction Error", err.message);
    } finally {
      setLoading(false); // 🔑 hide spinner
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.wrapper, { backgroundColor: theme.background }]}
    >

    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Buy Data</Text>


         {/* Phone Number with dropdown */}
          <Text style={[styles.label, { color: theme.label }]}>Phone Number</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              placeholder="e.g. 08012345678"
              placeholderTextColor={theme.placeholder}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              style={[styles.inputField, { color: theme.inputText }]}
            />
            <TouchableOpacity 
            style={styles.dropdownIcon}
            onPress={() => setShowDropdown(!showDropdown)}>
              <Ionicons
                  name={showDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.text}
                />
            </TouchableOpacity>
          </View>

          {showDropdown && previousNumbers.length > 0 && (
            <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {previousNumbers.map((num) => (
                <View key={num} style={styles.dropdownRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { setPhoneNumber(num); setShowDropdown(false); }}>
                    <Text style={{ color: theme.text }}>{num}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSavedNumber(num)}>
                    <Ionicons name="close" size={20} color={theme.subtitle} />
                  </TouchableOpacity>
                </View>
              ))}
              {defaultNumber && !previousNumbers.includes(defaultNumber) && (
                <View style={styles.dropdownItem}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { setPhoneNumber(defaultNumber); setShowDropdown(false); }}>
                    <Text style={{ color: theme.text }}>{defaultNumber} (default)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

           {/* Networks */}
        <Text style={[styles.label, { color: theme.label }]}>Network Provider</Text>

        {loadingPlans ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator size="small" />
            <Text style={{ color: theme.text, marginTop: 6 }}>Loading plans...</Text>
          </View>
        ) : providers.length === 0 ? (
          <Text style={{ color: theme.text }}>No providers available</Text>
        ) : (
          <View style={styles.networkContainer}>
            {providers.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => handleProviderPress(p.id)}
                style={[
                  styles.networkButton,
                  { backgroundColor: network === p.id ? theme.selectedBackground : theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={{ color: network === p.id ? theme.selectedText : theme.text, fontWeight: "600" }}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {network && (
          <>
            <Text style={[styles.label, { color: theme.label }]}>Select Plan Category</Text>

            {Object.keys(plansByCategory).length === 0 ? (
              <Text style={{ color: theme.text }}>No plans available for this provider.</Text>
            ) : (
              <>
                <View style={styles.categoryRow}>
                  {Object.keys(plansByCategory).map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => { setSelectedCategory(category); setSelectedPlan(null); }}
                      style={[
                        styles.categoryButton,
                        { backgroundColor: selectedCategory === category ? theme.selectedBackground : theme.card, borderColor: theme.border },
                      ]}
                    >
                      <Text style={{ color: selectedCategory === category ? theme.selectedText : theme.text, fontWeight: "bold" }}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.planGrid}>
                  {getCurrentPlans().map((plan) => (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => setSelectedPlan(plan)}
                      style={[
                        styles.planButton,
                        { backgroundColor: selectedPlan?.id === plan.id ? theme.selectedBackground : theme.card, borderColor: theme.border },
                      ]}
                    >
                      <Text style={{ color: selectedPlan?.id === plan.id ? theme.selectedText : theme.text, fontWeight: "bold" }}>
                        {plan.label} - ₦{plan.price}
                      </Text>
                      <Text style={{ color: theme.subtitle }}>{plan.validity}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {selectedPlan && (
          <View style={styles.planInfo}>
            <Text style={[styles.planInfoText, { color: theme.text }]}>
              Selected: {selectedPlan.label} - {selectedPlan.validity}
            </Text>
          </View>
        )}

          <TouchableOpacity
            style={[
              styles.payButton,
              { backgroundColor: theme.buttonBackground, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handlePay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.buttonText} />
            ) : (
              <Text style={[styles.payButtonText, { color: theme.buttonText }]}>
                Proceed to Pay
              </Text>
            )}
          </TouchableOpacity>

          {/* Modal */}
          <Modal visible={showModal} transparent animationType="fade">
            <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
              <View style={[styles.modalBox, { backgroundColor: theme.modalBg, borderColor: theme.accent }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Confirm Payment</Text>
                <Text style={{ color: theme.text }}>Network: {confirmData.network}</Text>
                <Text style={{ color: theme.text }}>Phone: {confirmData.phoneNumber}</Text>
                <Text style={{ color: theme.text }}>Plan: {confirmData.plan}</Text>
                <Text style={{ color: theme.text }}>Amount: ₦{confirmData.amount}</Text>
                <Text style={{ color: theme.text }}>Validity: {confirmData.validity}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
                    style={[styles.modalCancel, { borderColor: theme.accent }]}
                    disabled={loading}
                  >
                    <Text style={{ color: theme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmPayment}
                    style={[styles.modalConfirm, { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 }]}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff" }}>Confirm</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
      </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 25 },
  label: { fontSize: 16, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  previousList: { marginBottom: 10 },
  previousLabel: { fontSize: 14, marginBottom: 4 },
  previousItem: { padding: 6, borderRadius: 6, marginBottom: 4 },
  previousText: {},
  networkContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
   dropdownIcon: {
    position: "absolute",
    right: 10,
    top: "30%",
  },

  dropdownList: {
    paddingTop: 7,
    borderRadius: 8,
    marginTop: -6,
    marginBottom: 10,
  },

   dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  networkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 10 },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  planButton: {
    width: "48%",
    marginVertical: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  planInfo: { marginTop: 10, marginBottom: 20 },
  planInfoText: { fontSize: 16, fontWeight: "600" },
  payButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalCancel: { padding: 10, borderRadius: 8, borderWidth: 1, marginRight: 10 },
  modalConfirm: { padding: 10, borderRadius: 8 },
});
