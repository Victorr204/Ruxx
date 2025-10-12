// SubscriptionPage.jsx
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert
} from "react-native";
import axios from "axios";




const logoMap = {
  netflix: require("../assets/netflix.png"),
  spotify: require("../assets/spotify.png"),
  apple: require("../assets/apple.png"),
  tidal: require("../assets/tidal.png"),
  deezer: require("../assets/deezer.png")
};

// const profitRate = 0.065; // intentionally unused

export default function SubscriptionPage({ navigation }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const res = await axios.get("/api/blackrate");
      setExchangeRate(res.data.rate); // e.g., 1300
    } catch (_err) {
      Alert.alert("Error", "Failed to load exchange rate");
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get("/api/reloadly/subscriptions");
      setSubscriptions(res.data);
    } catch (_err) {
      Alert.alert("Error", "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (service) => {
    navigation.navigate("SubscriptionPlansPage", { service, exchangeRate });
  };

  const groupedServices = subscriptions.reduce((acc, item) => {
    const key = item.productName.toLowerCase().split(" ")[0]; // "netflix", etc.
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading || !exchangeRate) {
    return <ActivityIndicator size="large" color="green" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎬 Subscriptions</Text>
      {Object.keys(groupedServices).map(service => (
        <TouchableOpacity
          key={service}
          style={styles.card}
          onPress={() => handleSelect(groupedServices[service])}
        >
          <Image source={logoMap[service]} style={styles.logo} />
          <Text style={styles.title}>{service.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15
  },
  logo: { width: 40, height: 40, marginRight: 15 },
  title: { fontSize: 16, fontWeight: "bold" }
});
