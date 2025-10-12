import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Services() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { theme } = useTheme(); // ✅ use theme from context

  const itemSize = (width - 60) / 3;

  const services = [
    { name: "Airtime", route: "/airtimePage" },
    { name: "Data", route: "/dataPage" },
    { name: "TV", route: "/TVPage" },
    { name: "Electricity", route: "/ElectricityPage" },
    { name: "Betting", route: "/BettingPage" },
    { name: "Gift-Card", route: "" },
    { name: "Subscriptions", route: "" },
  ];

  const handlePress = (service) => {
    if (!service.route) {
      Alert.alert("Gift Card & suscription", "Gift card & subscription support coming soon!");
    } else {
      router.push(service.route);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.title, { color: theme.text }]}>Our Services</Text>
      <View style={styles.grid}>
        {services.map((service, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(service)}
            style={[
              styles.item,
              { width: itemSize, height: itemSize, backgroundColor: theme.card },
            ]}
          >
            <Text style={[styles.itemText, { color: theme.text }]}>
              {service.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  itemText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  safeArea: {
    flex: 1,
  },
});
