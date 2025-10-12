// SubscriptionPlansPage.jsx
import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Switch
} from "react-native";
import axios from "axios";

const profitRate = 0.065;

export default function SubscriptionPlansPage({ route }) {
  const { service, exchangeRate } = route.params;
  const [autoRenew, setAutoRenew] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);

  const calculateNairaPrice = (usdAmount) => {
    const withProfit = usdAmount + (usdAmount * profitRate);
    return Math.ceil(withProfit * exchangeRate); // round up
  };

  const handlePurchase = async (plan) => {
  Alert.alert(
    "Confirm Purchase",
    `Buy ${plan.productName} for ₦${calculateNairaPrice(plan.faceValue)}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Buy",
        onPress: async () => {
            try {
            setLoadingPlanId(plan.productId);
            await axios.post("/api/purchase", {
              type: "subscription",
              productId: plan.productId,
              productName: plan.productName,
              amount: plan.faceValue, // USD
              autoRenew,
              exchangeRate
            });

            Alert.alert("Success", "Subscription successful!");
          } catch (err) {
            console.error(err);
            Alert.alert("Error", err.response?.data?.error || "Purchase failed");
          } finally {
            setLoadingPlanId(null);
          }
        }
      }
    ]
  );
};


  return (
    <View style={styles.container}>
      <Text style={styles.header}>📦 {service[0]?.productName.split(" ")[0].toUpperCase()} Plans</Text>
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Auto-Renew:</Text>
        <Switch
          value={autoRenew}
          onValueChange={setAutoRenew}
          trackColor={{ true: "green", false: "grey" }}
        />
      </View>

      <FlatList
        data={service}
        keyExtractor={(item) => item.productId.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.plan}>{item.productName}</Text>
            <Text style={styles.price}>
              ₦{calculateNairaPrice(item.faceValue)}{" "}
              <Text style={styles.usd}>(${item.faceValue})</Text>
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handlePurchase(item)}
              disabled={loadingPlanId === item.productId}
            >
              <Text style={styles.buttonText}>
                {loadingPlanId === item.productId ? "Processing..." : "Subscribe"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "space-between"
  },
  toggleText: { fontSize: 16 },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15
  },
  plan: { fontSize: 16, fontWeight: "bold" },
  price: { marginTop: 5, fontSize: 16 },
  usd: { fontSize: 14, color: "gray" },
  button: {
    marginTop: 10,
    backgroundColor: "green",
    padding: 10,
    borderRadius: 6,
    alignItems: "center"
  },
  buttonText: { color: "#fff", fontWeight: "bold" }
});
