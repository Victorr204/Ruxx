import {
  View, Text, StyleSheet, ActivityIndicator,
  FlatList, TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { databases, account, Config } from "../../appwriteConfig";
import { useEffect, useState } from "react";
import { Query } from "appwrite";
import { useTheme } from "../../context/ThemeContext";

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = await account.get();

        // Admin broadcasts
        const adminResult = await databases.listDocuments(
          Config.databaseId,
          Config.adminNotificationsCollectionId,
          [
            Query.or([
              Query.equal("recipient", "all"),
              Query.equal("recipient", user.$id),
            ]),
            Query.orderDesc("$createdAt"),
          ]
        );

        // Personal notifications (welcome, deposits, etc.)
        const userResult = await databases.listDocuments(
  Config.databaseId,
  Config.notificationsCollectionId,
  [
    Query.equal("userId", user.$id),           // ✅ match the attribute in your schema
    Query.orderDesc("$createdAt"),
  ]
);

        const all = [...userResult.documents, ...adminResult.documents]
          .filter((v, i, a) => i === a.findIndex(t => t.$id === v.$id));

        setNotifications(all);
      } catch (err) {
        console.error("Error fetching notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (item) => {
    if (item.read) return;
    await databases.updateDocument(
      Config.databaseId,
      item.$collectionId,
      item.$id,
      { read: true }
    );
    setNotifications(prev =>
      prev.map(n => n.$id === item.$id ? { ...n, read: true } : n)
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.text }}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <Text style={[styles.header, { color: theme.text }]}>Notifications</Text>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => markAsRead(item)}
              style={[
                styles.card,
                { backgroundColor: theme.card, opacity: item.read ? 0.6 : 1 }
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {item.title || "Notification"}
              </Text>
              <Text style={[styles.cardMessage, { color: theme.text }]}>
                {item.message}
              </Text>
              <Text style={[styles.timestamp, { color: theme.subtitle }]}>
                {new Date(item.$createdAt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.subtitle, marginTop: 20 }}>
              No notifications yet.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20 },
  header: { fontSize: 20, fontWeight: "bold" },
  card: { padding: 15, borderRadius: 8, marginTop: 15 },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
  cardMessage: { fontSize: 14, marginBottom: 6 },
  timestamp: { fontSize: 12 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
