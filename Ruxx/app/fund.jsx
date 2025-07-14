import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { account, databases, Config } from '../appwriteConfig';
import { Query } from 'appwrite';

export default function Fund() {
  const [user, setUser] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVirtualAccount = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);

        const userDocs = await databases.listDocuments(
          Config.databaseId,
          Config.userCollectionId,
          [Query.equal('userId', currentUser.$id)]
        );

        if (!userDocs.total) throw new Error('User record not found');
        const userDoc = userDocs.documents[0];

        // Already has a virtual account
        if (userDoc.virtualAccount) {
          setAccountInfo(userDoc.virtualAccount);
        } else {
          // ❗ Create via your backend
          const response = await fetch('http://localhost:5000/create-virtual-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentUser.email,
              first_name: userDoc.name?.split(' ')[0] || '',
              last_name: userDoc.name?.split(' ')[1] || '',
              userId: currentUser.$id,
            }),
          });

          const data = await response.json();

          if (!data.virtualAccount) throw new Error('Failed to create virtual account');

          // Save to Appwrite
          await databases.updateDocument(
            Config.databaseId,
            Config.userCollectionId,
            userDoc.$id,
            {
              virtualAccount: JSON.stringify(data.virtualAccount),
            }
          );

          setAccountInfo(data.virtualAccount);
        }
      } catch (err) {
        console.error('Error:', err.message);
        Alert.alert('Error', err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualAccount();
  }, []);

  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Account number copied to clipboard.');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text>Loading account...</Text>
      </View>
    );
  }

  if (!accountInfo) {
    return (
      <View style={styles.center}>
        <Text>No virtual account info found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Fund Wallet</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Bank Name</Text>
        <Text style={styles.value}>{accountInfo.bank_name}</Text>

        <Text style={styles.label}>Account Number</Text>
        <TouchableOpacity onPress={() => copyToClipboard(accountInfo.account_number)}>
          <Text style={[styles.value, { color: '#2563eb' }]}>
            {accountInfo.account_number} (Tap to copy)
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Account Name</Text>
        <Text style={styles.value}>{accountInfo.account_name}</Text>
      </View>

      <Text style={styles.note}>
        Send money to the above virtual account. It will be credited to your wallet automatically once confirmed.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: 'bold', color: '#065f46', marginTop: 10 },
  value: { fontSize: 16, color: '#111827' },
  note: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
});
