import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
   Animated
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { account, databases, Config } from "../appwriteConfig";
import { Query } from "appwrite";
import Balance from "./balance";
import { useTheme } from "../context/ThemeContext";

export default function Dashboard({ userId, refreshing, onRefresh }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [welcomeNote, setWelcomeNote] = useState(null);


  const { theme } = useTheme(); // ✅ use theme instead of isDarkMode

  useEffect(() => {

    
    const fetchUser = async () => {
      try {
        const currentUser = await account.get();
        console.log("Current user:", currentUser);
        setUser(currentUser);

        const userDocs = await databases.listDocuments(
          Config.databaseId,
          Config.userCollectionId,
          [Query.equal("userId", currentUser.$id)]
        );

        const kycDocs = await databases.listDocuments(
          Config.databaseId,
          Config.kycCollectionId,
          [Query.equal("userId", currentUser.$id)]
        );

        if (kycDocs.total > 0) {
          const status = (kycDocs.documents[0].status || "").toLowerCase();
          const validStatuses = [
            "verified",
            "rejected",
            "pending",
            "submitted",
          ];
          setKycStatus(validStatuses.includes(status) ? status : "pending");
        } else {
          setKycStatus(null);
        }

        if (!userDocs.total) throw new Error("User data not found");
        setUserData(userDocs.documents[0]);
      } catch (error) {
        Alert.alert("Error", error.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const interval = setInterval(() => {
    fetchUser(); // Refresh every 10 seconds
  }, 10000);

  return () => clearInterval(interval);

  }, []);


   //welcome Alert

    useEffect(() => {
    const fetchNotification = async () => {
      try {
        const res = await databases.listDocuments(
          Config.databaseId,
          Config.notificationsCollectionId,
          [
            Query.equal("userId", userId),
            Query.equal("read", false),
            Query.equal("type", "welcome"),
          ]
        );

        if (res.documents.length > 0) {
          setWelcomeNote(res.documents[0]);
        }
      } catch (err) {
        console.log("Notification fetch error:", err.message);
      }
    };

    fetchNotification();
  }, [userId]);

  const dismiss = async () => {
    if (welcomeNote) {
      await databases.updateDocument(
        Config.databaseId,
        Config.notificationsCollectionId,
        [Query.equal("userId", userId)],
        welcomeNote.$id,
        { read: true }
      );
      setWelcomeNote(null);
    }
  };





  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!user || !userData) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.text }}>User not found. </Text>
        <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.link}>login</Text>
              </TouchableOpacity>
      </View>
    );
  }

  const services = [
    { id: "1", name: "Airtime", route: "/airtimePage" },
    { id: "2", name: "Data", route: "/dataPage" },
    { id: "3", name: "TV Subscription", route: "/TVPage" },
    { id: "4", name: "Electricity", route: "/ElectricityPage" },
    { id: "5", name: "Betting", route: "/BettingPage" },
    { id: "6", name: "More", route: "/services" },
  ];

  const renderKycBadge = () => {
    if (kycStatus === "verified") {
      return <Text style={[styles.verifiedBadge, { color: "green" }]}>✔ Verified</Text>;
    }

    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {kycStatus === "rejected" && (
          <Text style={[styles.statusBadge, { color: theme.danger }]}>❌ Rejected</Text>
        )}
        {kycStatus === "pending" && (
          <Text style={[styles.statusBadge, { color: theme.accent }]}>⏳ Pending</Text>
        )}
        {kycStatus === null && (
          <Text style={[styles.statusBadge, { color: theme.placeholder }]}>❗ Not Submitted</Text>
        )}

        <TouchableOpacity
          style={[styles.kycButton, { backgroundColor: theme.buttonBackground }]}
          onPress={() => router.push("/verify")}
        >
          <Text style={{ color: theme.buttonText, fontWeight: "bold", fontSize: 12 }}>
            Complete KYC
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    
    <FlatList
      refreshing={refreshing}
      onRefresh={onRefresh}
     
      data={services}
      numColumns={2}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      columnWrapperStyle={{ justifyContent: "space-between" }}
      ListHeaderComponent={
        <>

        {/* Show hover notification */}
      {welcomeNote && (
        <Animated.View style={styles.notification}>
          <Text style={styles.title}>{welcomeNote.title}</Text>
          <Text style={styles.msg}>{welcomeNote.message}</Text>
          <TouchableOpacity onPress={dismiss}>
            <Text style={styles.close}>✖</Text>
          </TouchableOpacity>
        </Animated.View>
      )}


          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Image
                source={
                  userData.profilePic
                    ? { uri: userData.profilePic }
                    : require("../assets/images/profile.png")
                }
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.headerRow}>
            <Text style={[styles.greeting, { color: theme.text }]}>
              Welcome, {userData.name ? userData.name.split(" ")[0] : user.email}
            </Text>
            {renderKycBadge()}
          </View>

          <View style={[styles.balanceContainer, ]}>
            <View style={styles.balanceRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.balanceLabel, ]}>Balance</Text>
                <TouchableOpacity
                  onPress={() => setShowBalance(!showBalance)}
                  style={{ marginLeft: 6 }}
                >
                  <Ionicons
                    name={showBalance ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={theme.itext}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => router.push("/TransactionHistory")}>
                <Text style={[styles.transactionText, { color: theme.ttext }]}>
                  Transaction History
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.balanceAmount, { color: theme.text }]}>
              {showBalance ? <Balance /> : "••••••"}
            </Text>

            <View style={styles.buttonRowSingle}>
              <TouchableOpacity
                style={[styles.fundButtonSingle, { backgroundColor: theme.fundbg }]}
                onPress={() => router.push("/fund")}
              >
                <Text style={{color: theme.ftext, fontWeight: "bold" }}>Fund</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.serviceItem, { backgroundColor: theme.scard }]}
          onPress={() => router.push(item.route)}
        >
          <Text style={[styles.serviceText, { color: theme.text }]}>{item.name}</Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        userData.role === "admin" ? (
          <TouchableOpacity
            onPress={() => router.push("/AdminScreen")}
            style={[styles.adminButton, { backgroundColor: theme.buttonBackground }]}
          >
            <Text style={{ color: theme.buttonText, fontWeight: "bold" }}>Go to Admin Panel</Text>
          </TouchableOpacity>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, flexGrow: 1 },
  greeting: { fontSize: 22, fontWeight: "bold" },
  profileImageContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 90,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  kycButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
    marginTop: 4,
  },
  statusBadge: {
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 14,
    paddingTop: 4,
  },
  verifiedBadge: {
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 14,
    paddingTop: 4,
  },
  balanceContainer: {
    backgroundColor: '#4ADE80',
    padding: 20,
    borderRadius: 12,
    marginVertical: 15,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  transactionText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "left",
  },
  buttonRowSingle: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  fundButtonSingle: {
  backgroundColor: '#fff',
  paddingVertical: 10,
  paddingHorizontal: 25,
  borderRadius: 8,
  alignItems: 'center',
},
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
  serviceItem: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  serviceText: { fontSize: 16, fontWeight: "500" },
  adminButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

   notification: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  msg: { fontSize: 14, color: "#555" },
  close: { fontSize: 18, color: "red", position: "absolute", right: 10, top: 5 },
});
