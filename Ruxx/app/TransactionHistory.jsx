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
import { useTheme } from '../context/ThemeContext';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

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
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ActivityIndicator size="large" style={{ marginTop: 50 }} color={theme.primary} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.pageBg }]}> 
        <Text style={[styles.title, { color: theme.text }]}>Transaction History</Text>
        {transactions.length === 0 ? (
          <Text style={[styles.empty, { color: theme.subtitle }]}>No transactions found.</Text>
        ) : (
          transactions.map((txn) => (
            <View key={txn.$id} style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <Text style={[styles.label, { color: theme.label }]}> 
                Service: <Text style={[styles.value, { color: theme.text }]}>{txn.serviceType}</Text>
              </Text>
              <Text style={[styles.label, { color: theme.label }]}> 
                To: <Text style={[styles.value, { color: theme.text }]}>{txn.recipient}</Text>
              </Text>
              <Text style={[styles.label, { color: theme.label }]}> 
                Provider: <Text style={[styles.value, { color: theme.text }]}>{txn.provider}</Text>
              </Text>
              <Text style={[styles.label, { color: theme.label }]}> 
                Amount: ₦<Text style={[styles.value, { color: theme.text }]}>{txn.amount}</Text>
              </Text>
              <Text style={[styles.label, {color: theme.label}]}>
                Status:{' '}
                <Text
                  style={[
                    styles.value,
                    { color: txn.status === 'Success' ? theme.primary : theme.danger },
                  ]}
                >
                  {txn.status}
                </Text>
              </Text>
              <Text style={[styles.timestamp, { color: theme.subtitle }]}> 
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
    
  },
  item: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
  },
  label: {
    fontWeight: '600',
    
  },
  value: {
    fontWeight: 'normal',
    
  },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
   
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    
  },
});
