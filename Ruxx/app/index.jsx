// app/index.jsx
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import Logos from "../assets/images/backlogo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Landing() {
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      const hasRegistered = await AsyncStorage.getItem("hasRegistered");
      if (hasRegistered === "true") {
        router.replace("/login");
      } else {
        setCheckingStatus(false);
      }
    };
    checkRegistration();
  }, []);

  if (checkingStatus) return null;

  return (
    <View style={styles.container}>
      <Image source={Logos} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Payment Made Easy</Text>

      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const GOLD = "#FFD700";
const BLACK = "#000000";
// const WHITE = "#FFFFFF"; // unused
const GRAY = "#B0B0B0";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 300,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    color: GOLD,
    fontWeight: "700",
    marginBottom: 50,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  buttonPrimary: {
    backgroundColor: GOLD,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: GOLD,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  buttonText: {
    color: BLACK,
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  loginText: {
    color: GRAY,
    fontSize: 14,
    marginTop: 10,
    textDecorationLine: "underline",
  },
});
