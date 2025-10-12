import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { account, databases, Config } from '../appwriteConfig';
import { Query } from 'appwrite';
import { useTheme } from '../context/ThemeContext';

export default function Fund() {
  const { theme } = useTheme();

  // eslint-disable-next-line no-unused-vars
  const [_user, setUser] = useState(null); // intentionally unused variable
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVirtualAccount = async () => {
      try {
        const currentUser = await account.get();
        // keep user assignment in case caller expects it later
        setUser(currentUser); // linter should accept this

        const userDocs = await databases.listDocuments(
          Config.databaseId,
          Config.userCollectionId,
          [Query.equal('userId', currentUser.$id)]
        );

        if (!userDocs.total) throw new Error('User record not found');
        const userDoc = userDocs.documents[0];

        // Already has a virtual account
        if (userDoc.virtualAccount) {
          const parsed =
            typeof userDoc.virtualAccount === 'string'
              ? JSON.parse(userDoc.virtualAccount)
              : userDoc.virtualAccount;

          setAccountInfo(parsed);
        } else {
          console.log('Creating virtual account...');

          const res = await fetch(
            'https://ruxx-paystack.vercel.app/api/create-virtual-account',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: currentUser.email,
                first_name: userDoc.name?.split(' ')[0] || '',
                last_name: userDoc.name?.split(' ')[1] || '',
                phone: userDoc.phone || currentUser.phone || '',
                userId: currentUser.$id,
              }),
            }
          );

          const text = await res.text();
          console.log('Raw API response:', text);

          let data;
          try {
            data = JSON.parse(text);
          } catch (_err) {
            throw new Error('Invalid JSON returned from virtual account API');
          }

          if (!res.ok || !data.virtualAccount || !data.virtualAccount.customer_code) {
            const errMsg =
              data?.message || data?.error || 'Failed to create virtual account';
            throw new Error(errMsg);
          }

          const customerCode = data.virtualAccount.customer_code;

          // Save to Appwrite
          await databases.updateDocument(
            Config.databaseId,
            Config.userCollectionId,
            userDoc.$id,
            {
              virtualAccount: JSON.stringify(data.virtualAccount),
              paystackCustomerCode: customerCode, // <- flatten for webhook
            }
          );

          setAccountInfo(data.virtualAccount);
        }
      } catch (_err) {
        console.error('❌ Error:', _err.message);
        Alert.alert('Error', _err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchVirtualAccount();
  }, []);

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Account number copied to clipboard.');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text }}>Loading account...</Text>
      </View>
    );
  }

  if (!accountInfo) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>No virtual account info found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Fund Wallet</Text>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.label }]}>Bank Name</Text>
        <Text style={[styles.value, { color: theme.text }]}>{accountInfo.bank_name}</Text>

        <Text style={[styles.label, { color: theme.label }]}>Account Number</Text>
        <TouchableOpacity onPress={() => copyToClipboard(accountInfo.account_number)}>
          <Text style={[styles.value, { color: theme.text }]}>
            {accountInfo.account_number} (Tap to copy)
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: theme.label }]}>Account Name</Text>
        <Text style={[styles.value, { color: theme.text }]}>{accountInfo.account_name}</Text>
      </View>

      <Text style={[styles.note, { color: theme.subtitle }]}>
        Send money to the above virtual account. It will be credited to your wallet automatically once confirmed. 
        For every amount deposited a 1.5% fee is deducted and for ₦10,000 and above 1.5% + ₦50 
        electronic money transfer levy is deducted.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: 'bold', marginTop: 10 },
  value: { fontSize: 16 },
  note: { fontSize: 14, textAlign: 'center' },
});
