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

  const fetchUserTransactions = async () => {
    try {
      const user = await account.get();

      const { documents } = await databases.listDocuments(
        Config.databaseId,
        Config.txnCollectionId,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt'),
        ]
      );

      setTransactions(documents);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTransactions();
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
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000', // black title text
  },
  item: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5', // light neutral background
    padding: 14,
    borderRadius: 10,
  },
  label: {
    fontWeight: '600',
    color: '#000', // black label text
  },
  value: {
    fontWeight: 'normal',
    color: '#333', // dark gray value text
  },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    color: '#555', // medium gray timestamp
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666', // soft gray for empty state
  },
});
