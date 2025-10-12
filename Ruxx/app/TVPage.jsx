import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { account, databases, Config } from "../appwriteConfig";
import { saveTransaction } from "../utils/saveTransaction";
import { SafeAreaView } from "react-native-safe-area-context";
import { Query } from "appwrite";
import { useTheme } from "../context/ThemeContext";

export default function TVPage() {
  const { theme } = useTheme();

  const [smartCard, setSmartCard] = useState("");
  const [providers, setProviders] = useState([]);
  const [provider, setProvider] = useState("");
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [previousCards, setPreviousCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [user, setUser] = useState(null);
  const [balanceDoc, setBalanceDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
   
   
  useEffect(() => {
    fetchProviders();
    loadPreviousCards();
    fetchUser();
  }, []);

   
  // fetchPlans is intentionally left out of deps to avoid re-fetch loops
   
   
   
  useEffect(() => {
    if (provider) fetchPlans(provider);
  }, [provider]);

  const fetchUser = async () => {
    try {
      const u = await account.get();
      setUser(u);

      const res = await databases.listDocuments(
        Config.databaseId,
        Config.balanceCollectionId,
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

  // --- Helpers to normalize API shapes ---
  const normalizeProviders = (rawItems = []) => {
    // If your backend already returns [{id, name}], this keeps it.
    // If it returns variations, we dedupe by service_id.
    const mapped = rawItems.map((it, idx) => ({
      id: it.id || it.service_id || it.provider_id || `p-${idx}`,
      name:
        it.name ||
        it.service_name ||
        it.provider_name ||
        // fallback for some odd payloads
        (it.package_bouquet ? String(it.service_name || it.service_id) : "Unknown"),
    }));
    // de-dupe by id
    const seen = new Set();
    const unique = [];
    for (const p of mapped) {
      if (!p.id || seen.has(p.id)) continue;
      seen.add(p.id);
      unique.push(p);
    }
    // If API mistakenly returned a long list of variations, this collapses to just dstv/gotv/startimes/showmax
    return unique.filter(p =>
      ["dstv", "gotv", "startimes", "showmax"].includes(p.id.toLowerCase())
    ).length
      ? unique.filter(p =>
          ["dstv", "gotv", "startimes", "showmax"].includes(p.id.toLowerCase())
        )
      : unique;
  };

  const normalizePlans = (rawItems = []) =>
    rawItems.map((it, idx) => ({
      variation_id: String(it.variation_id ?? it.id ?? idx),
      label: it.package_bouquet || it.label || it.name || "Plan",
      price: Number(it.price ?? it.amount ?? 0),
      service_id: it.service_id || "",
    }));

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://ruxx-paystack.vercel.app/api/ebills/plans?type=tv"
      );
      const data = await res.json();

      // Supports either {items:[{id,name}]} OR {data:[variations]}
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
      const normalized = normalizeProviders(items);

      // If nothing recognizable came back, fall back to static
      const finalProviders =
        normalized.length > 0
          ? normalized
          : [
              { id: "dstv", name: "DStv" },
              { id: "gotv", name: "GOtv" },
              { id: "startimes", name: "Startimes" },
              { id: "showmax", name: "Showmax" },
            ];

      setProviders(finalProviders);
      // Auto-select first provider if none selected
      if (!provider && finalProviders.length) setProvider(finalProviders[0].id);
    } catch (err) {
      console.error("❌ Failed to fetch providers:", err);
      Alert.alert("Error", "Could not load TV providers.");
      // graceful fallback
      setProviders([
        { id: "dstv", name: "DStv" },
        { id: "gotv", name: "GOtv" },
        { id: "startimes", name: "Startimes" },
        { id: "showmax", name: "Showmax" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async (selectedProvider) => {
    setLoadingPlans(true);
    try {
      const res = await fetch(
        `https://ruxx-paystack.vercel.app/api/ebills/plans?type=tv&provider=${selectedProvider}`
      );
      const data = await res.json();

      // Supports {items:[...]} OR EBills {data:[...]}
      const list = Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : [];
      const normalized = normalizePlans(list).filter(
        p => (p.service_id || selectedProvider) === selectedProvider
      );

      setPlans(normalized);
      setSelectedPlan(null);
    } catch (err) {
      console.error("❌ Failed to load TV plans:", err);
      Alert.alert("Error", "Failed to load TV plans.");
      setPlans([]);
      setSelectedPlan(null);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadPreviousCards = async () => {
    try {
      const stored = await AsyncStorage.getItem("tv_cards");
      if (stored) setPreviousCards(JSON.parse(stored));
    } catch {}
  };

  const saveSmartCard = async (number) => {
    let updated = [number, ...previousCards.filter((n) => n !== number)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    await AsyncStorage.setItem("tv_cards", JSON.stringify(updated));
    setPreviousCards(updated);
  };

  const handlePay = () => {
    if (!smartCard || !provider || !selectedPlan) {
      Alert.alert("Missing Info", "Please select all fields.");
      return;
    }
    setConfirmData({
      smartCard,
      provider,
      amount: selectedPlan.price,
      plan: selectedPlan.label,
      variation_id: selectedPlan.variation_id, // ✅ use variation_id
    });
    setShowModal(true);
  };

  const confirmPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://ruxx-paystack.vercel.app/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "tv",
          userId: user.$id,
          smartCard: confirmData.smartCard,
          provider: confirmData.provider,
          variation_id: confirmData.variation_id, // ✅ use variation_id
          amount: parseInt(confirmData.amount),
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "TV subscription failed.");
      }

      await saveSmartCard(confirmData.smartCard);

      await saveTransaction({
        userId: user.$id,
        serviceType: "TV",
        recipient: confirmData.smartCard,
        provider: confirmData.provider,
        amount: parseInt(confirmData.amount),
        status: "Success",
      });

      if (result.newBalance !== undefined) {
        setBalanceDoc({ ...balanceDoc, balance: result.newBalance });
      }

      setShowModal(false);
      Alert.alert(
        "Success",
        `₦${confirmData.amount} TV subscription sent to ${confirmData.smartCard}`
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={ {  flex: 1, backgroundColor: theme.background }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.wrapper, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>TV Subscription</Text>

        <Text style={[styles.label, { color: theme.text }]}>
          Smartcard / IUC Number
        </Text>
        <TextInput
          placeholder="e.g. 2012345678"
          placeholderTextColor={theme.inputText}
          keyboardType="number-pad"
          value={smartCard}
          onChangeText={setSmartCard}
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />

        {previousCards.length > 0 && (
          <View style={styles.previousList}>
            <Text style={[styles.previousLabel, { color: theme.text }]}>
              Previous Cards:
            </Text>
            {previousCards.map((num, index) => (
              <TouchableOpacity
                key={`card-${index}-${num}`}
                onPress={() => setSmartCard(num)}
                style={[
                  styles.previousItem,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text style={{ color: theme.text }}>{String(num)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: theme.text }]}>
          Select TV Provider
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.text} />
        ) : (
          <View style={styles.networkContainer}>
            {providers.map((item) => (
              <TouchableOpacity
                key={`provider-${item.id}`}
                onPress={() => {
                  setProvider(item.id);
                  setSelectedPlan(null);
                }}
                style={[
                  styles.networkButton,
                  {
                    backgroundColor:
                      provider === item.id
                        ? theme.buttonBackground
                        : theme.cardBackground,
                  },
                ]}
              >
                <Text
                  style={{
                    color: provider === item.id ? theme.buttonText : theme.text,
                    fontWeight: "600",
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loadingPlans && <ActivityIndicator size="large" color={theme.text} />}

{plans.length > 0 && !loadingPlans && (
  <>
    {/* ✅ Services Section Header */}
    <Text
      style={[
        styles.label,
        { color: theme.text, marginTop: 10, marginBottom: 6 },
      ]}
    >
      Services
    </Text>

    <View style={styles.planGrid}>
      {plans.map((plan) => (
        <TouchableOpacity
          key={`plan-${plan.variation_id}`}
          onPress={() => setSelectedPlan(plan)}
          style={[
            styles.planButton,
            {
              backgroundColor:
                selectedPlan?.variation_id === plan.variation_id
                  ? theme.buttonBackground
                  : theme.cardBackground,
            },
          ]}
        >
          <Text
            style={{
              color:
                selectedPlan?.variation_id === plan.variation_id
                  ? theme.buttonText
                  : theme.text,
              fontWeight: "bold",
            }}
          >
            {plan.label}
          </Text>
          <Text
            style={{
              fontSize: 12,
              marginTop: 4,
              color:
                selectedPlan?.variation_id === plan.variation_id
                  ? theme.buttonText 
                  : theme.secondaryText,
            }}
          >
            ₦{plan.price}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </>
)}


        {selectedPlan && (
          <View style={styles.planInfo}>
            <Text
              style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}
            >
              Selected: {selectedPlan.label} — ₦{selectedPlan.price}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: theme.buttonBackground },
          ]}
          onPress={handlePay}
        >
          <Text style={[styles.payButtonText, { color: theme.buttonText }]}>
            Proceed to Pay
          </Text>
        </TouchableOpacity>

        <Modal visible={showModal} transparent animationType="fade">
          <View
            style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          >
            <View
              style={[
                styles.modalBox,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Confirm Payment
              </Text>
              <Text style={{ color: theme.text }}>
                Provider: {confirmData?.provider || ""}
              </Text>
              <Text style={{ color: theme.text }}>
                Smartcard: {confirmData?.smartCard || ""}
              </Text>
              <Text style={{ color: theme.text }}>
                Plan: {confirmData?.plan || ""}
              </Text>
              <Text style={{ color: theme.text }}>
                Amount: ₦{confirmData?.amount ?? 0}
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
                  <Text style={[styles.modalCancelText, { color: theme.text }]}>
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
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  previousList: { marginBottom: 10 },
  previousLabel: { fontSize: 14, marginBottom: 4 },
  previousItem: { padding: 6, borderRadius: 6, marginBottom: 4 },
  networkContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  networkButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  planGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 10, marginBottom: 10 },
  planButton: { width: "48%", marginVertical: 6, padding: 12, borderRadius: 12, alignItems: "center" },
  planInfo: { marginTop: 10, marginBottom: 20 },
  payButton: { padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  payButtonText: { fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", padding: 20, borderRadius: 12, borderWidth: 2 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  modalCancel: { padding: 10, borderRadius: 8, borderWidth: 1 },
  modalCancelText: { fontWeight: "bold" },
  modalConfirm: { padding: 10, borderRadius: 8 },
  modalConfirmText: { fontWeight: "bold" },
});
