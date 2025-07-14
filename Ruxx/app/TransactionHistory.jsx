import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, account, Query, Config } from '../appwriteConfig';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const user = await account.get();

        const res = await databases.listDocuments(
          Config.databaseId,
          Config.txnCollectionId,
          [
            Query.equal('userId', user.$id),
            Query.orderDesc('$createdAt'),
          ]
        );

        setTransactions(res.documents);
      } catch (err) {
        console.error('Error loading transactions', err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={styles.empty}>No transactions found.</Text>
        ) : (
          transactions.map((txn) => (
            <View key={txn.$id} style={styles.item}>
              <Text style={styles.label}>
                Service: <Text style={styles.value}>{txn.serviceType}</Text>
              </Text>
              <Text style={styles.label}>
                To: <Text style={styles.value}>{txn.recipient}</Text>
              </Text>
              <Text style={styles.label}>
                Provider: <Text style={styles.value}>{txn.provider}</Text>
              </Text>
              <Text style={styles.label}>
                Amount: ₦<Text style={styles.value}>{txn.amount}</Text>
              </Text>
              <Text style={styles.label}>
                Status:{' '}
                <Text
                  style={[
                    styles.value,
                    { color: txn.status === 'Success' ? 'green' : 'red' },
                  ]}
                >
                  {txn.status}
                </Text>
              </Text>
              <Text style={styles.timestamp}>
                Date: {new Date(txn.$createdAt).toLocaleDateString()}{' '}
                {new Date(txn.$createdAt).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    marginBottom: 16,
    backgroundColor: '#f0fdf4',
    padding: 14,
    borderRadius: 10,
  },
  label: { fontWeight: '600', color: '#14532d' },
  value: { fontWeight: 'normal', color: '#064e3b' },
  timestamp: { marginTop: 6, fontSize: 12, color: '#4b5563' },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6b7280',
  },
});
