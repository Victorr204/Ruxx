// screens/SettingsScreen.js
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Linking,
  ScrollView,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import {
  Sun,
  Moon,
  Monitor,
  User,
  HelpCircle,
  FileText,
  Mail,
  Gift,
  Share2,
  LogOut,
} from "lucide-react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { account, databases, Config } from "../../appwriteConfig";
import { Query } from "appwrite";
import * as Clipboard from "expo-clipboard";

export default function SettingsScreen() {
  const { theme, mode, setMode } = useTheme(); // <-- use mode + theme

  const [referralDoc, setReferralDoc] = useState(null);

useEffect(() => {
  const fetchReferral = async () => {
    const user = await account.get();
    const existing = await databases.listDocuments(
      Config.databaseId,
      Config.referralsCollectionId,
      [Query.equal("ownerId", user.$id)]
    );
    if (existing.total > 0) setReferralDoc(existing.documents[0]);
  };
  fetchReferral();
}, []);

  // Cycle Light → Dark → System
  const cycleTheme = async () => {
    const nextMode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    setMode(nextMode);
    await AsyncStorage.setItem("themeMode", nextMode);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("pinVerified");
              await account.deleteSession("current");
              router.replace("/login");
            } catch (err) {
              Alert.alert("Logout Failed", err.message || "Could not log out. Try again.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>Settings</Text>

      {/* Theme Switch */}
      <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          {mode === "light" ? "Light Mode" : mode === "dark" ? "Dark Mode" : "System Default"}
        </Text>
        <TouchableOpacity onPress={cycleTheme} style={styles.iconButton}>
          {mode === "light" && <Sun size={28} color={theme.icon} />}
          {mode === "dark" && <Moon size={28} color={theme.icon} />}
          {mode === "system" && <Monitor size={28} color={theme.icon} />}
        </TouchableOpacity>
      </View>

      {/* Profile Management */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push("/profile")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Profile Management</Text>
        <User size={22} color={theme.icon} />
      </TouchableOpacity>

      {/* Help & Support */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => Linking.openURL("mailto:info@ruxxdigital.name.ng")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Help & Support (Email)</Text>
        <Mail size={22} color={theme.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push("/SupportChat")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Help & Support (Chat)</Text>
        <HelpCircle size={22} color={theme.icon} />
      </TouchableOpacity>

      {/* Terms & Privacy */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push("/terms")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Terms of Service</Text>
        <FileText size={22} color={theme.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push("/privacy")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Privacy Policy</Text>
        <FileText size={22} color={theme.icon} />
      </TouchableOpacity>

      {/* Change Email */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => Alert.alert("Email change", "Change of email coming soon!")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Change Email</Text>
        <Mail size={22} color={theme.icon} />
      </TouchableOpacity>

      {/* Referral & Rewards */}
      <TouchableOpacity
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push("/referrals")}
      >
        <Text style={[styles.label, { color: theme.text }]}>Referral & Rewards</Text>
        <Gift size={22} color={theme.icon} />
      </TouchableOpacity>


      {/* Referral Code Sharing */}
<TouchableOpacity
  style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
  onPress={() => {
    if (!referralDoc?.code) {
      Alert.alert("No Referral Code", "Your referral code is not available yet.");
      return;
    }

    Alert.alert(
      "Share Referral",
      `Share your referral code: ${referralDoc.code}`,
      [
        {
          text: "Copy",
          onPress: async () => {
            await Clipboard.setStringAsync(referralDoc.code);
            Alert.alert("Copied!", `Referral code ${referralDoc.code} copied.`);
          },
        },
        {
          text: "Share",
          onPress: async () => {
            try {
              await Share.share({
                message: `Join RuxxPay using my referral code: ${referralDoc.code}`,
              });
            } catch (err) {
              console.error("Share failed:", err);
            }
          },
        },
      ]
    );
  }}
>
  <Text style={[styles.label, { color: theme.text }]}>Share Referral Code</Text>
  <Share2 size={22} color={theme.icon} />
</TouchableOpacity>


      {/* Logout */}
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: theme.card, borderColor: "red" },
          styles.logoutRow,
        ]}
        onPress={handleLogout}
      >
        <Text style={[styles.label, { color: "red" }]}>Logout</Text>
        <LogOut size={22} color="red" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  iconButton: {
    borderRadius: 50,
    padding: 4,
  },
  logoutRow: {
    borderColor: "red",
  },
  header: {
    fontSize: 25,
    marginBottom: 20,
    fontWeight: "bold",
  },
});
