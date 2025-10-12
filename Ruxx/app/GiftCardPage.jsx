import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet
} from "react-native";
import axios from "axios";
import { account } from "../appwriteConfig";

export default function GiftCardPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState(null);
  const [rate, setRate] = useState(null); // 🔥 Exchange rate state

  useEffect(() => {
    loadUser();
    loadProducts();
    fetchExchangeRate(); // 🔥 Fetch exchange rate
  }, []);

  const loadUser = async () => {
    try {
      const user = await account.get();
      setUserId(user.$id);

      const balRes = await axios.get(`/api/get-balance?userId=${user.$id}`);
      setBalance(balRes.data.balance || 0);
    } catch (_err) {
      console.error("Error loading user:", _err.message);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await axios.get("/api/reloadly/products");
      setProducts(res.data);
    } catch (_err) {
      Alert.alert("Error", "Could not load gift cards.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const res = await axios.get("/api/blackmarket-rate");
      setRate(res.data.rate); // e.g., 1510
    } catch (err) {
      console.error("Error fetching exchange rate:", err.message);
    }
  };

  const handlePurchase = async (item) => {
    const usd = item.denomination || 100;
    const unitPrice = Math.ceil(usd * rate * 1.065); // Apply 6.5% gain

    Alert.alert(
      "Confirm Purchase",
      `Buy ${item.productName} for ₦${unitPrice}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy",
          onPress: async () => {
            try {
              const res = await axios.post("/api/reloadly/purchase", {
                userId,
                productId: item.productId,
                amount: unitPrice,
                email: "recipient@example.com"
              });
              setBalance(res.data.newBalance);
              Alert.alert("Success", `Order completed: ${res.data.order.productName}`);
            } catch (err) {
              Alert.alert("Error", err.response?.data?.error || "Purchase failed");
            }
          }
        }
      ]
    );
  };

  if (loading || !rate) {
    return <ActivityIndicator size="large" color="green" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎁 Gift Cards</Text>
      <Text style={styles.balance}>Balance: ₦{balance.toLocaleString()}</Text>
      <Text style={styles.rateText}>💱 1 USD ≈ ₦{rate.toLocaleString()} (Black Market)</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.productId.toString()}
        renderItem={({ item }) => {
          const usd = item.denomination || 100;
          const unitPrice = Math.ceil(usd * rate * 1.065); // 6.5% profit gain

          return (
            <View style={styles.card}>
              <Text style={styles.name}>{item.productName}</Text>
              <Text>USD: ${usd}</Text>
              <Text style={{ marginVertical: 4 }}>Price: ₦{unitPrice.toLocaleString()}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handlePurchase(item)}
              >
                <Text style={styles.buttonText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  balance: { fontSize: 16, marginBottom: 5, color: "green" },
  rateText: { fontSize: 14, color: "#444", marginBottom: 15 },
  card: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  name: { fontSize: 16, fontWeight: "bold" },
  button: {
    backgroundColor: "green",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center"
  },
  buttonText: { color: "#fff", fontWeight: "bold" }
});
