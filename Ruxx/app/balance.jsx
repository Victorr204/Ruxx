import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { account, databases, Query, Config } from '../appwriteConfig';

export default function Balance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const user = await account.get();

        const { documents } = await databases.listDocuments(
          Config.databaseId,
          Config.balanceCollectionId,
          [Query.equal('userId', user.$id)]
        );

        if (documents.length > 0) {
          setBalance(documents[0].amount); // or .availableBalance if you use that
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('Error loading balance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBalance();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View >
      <Text style={styles.amount}>₦{balance?.toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  label: { fontSize: 16, color: '#1e3a8a' },
  amount: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
});