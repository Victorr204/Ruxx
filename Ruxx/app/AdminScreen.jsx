import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { account, databases, Config } from '../appwriteConfig';

const AdminScreen = () => {
  const [kycList, setKycList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('kyc'); // 'kyc' or 'transactions'

  useEffect(() => {
    const checkRoleAndFetch = async () => {
      try {
        const sessionUser = await account.get();
        const userDoc = await databases.getDocument(
          Config.databaseId,
          Config.userCollectionId,
          sessionUser.$id
        );

        if (userDoc.role === 'admin') {
          setIsAdmin(true);

          const kycRes = await databases.listDocuments(
            Config.databaseId,
            Config.kycCollectionId
          );
          const txnRes = await databases.listDocuments(
            Config.databaseId,
            Config.txnCollectionId
          );

          setKycList(kycRes.documents);
          setTransactions(txnRes.documents);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin check error:', error.message);
      } finally {
        setLoading(false);
      }
    };

    checkRoleAndFetch();
  }, []);

  const updateKycStatus = async (docId, newStatus, userId) => {
    await databases.updateDocument(
      Config.databaseId,
      Config.kycCollectionId,
      docId,
      { status: newStatus }
    );

    setKycList(prev =>
      prev.map(item => (item.$id === docId ? { ...item, status: newStatus } : item))
    );

    if (userId) {
      await databases.updateDocument(
        Config.databaseId,
        Config.userCollectionId,
        userId,
        {
          verified: newStatus === 'verified',
        }
      );
    }
  };

  const deleteKyc = async (id) => {
    await databases.deleteDocument(
      Config.databaseId,
      Config.kycCollectionId,
      id
    );
    setKycList(prev => prev.filter(item => item.$id !== id));
  };

  const filteredIdDetails = (item) => {
    let parsed = {};
    try {
      parsed = typeof item.idDetails === 'string' ? JSON.parse(item.idDetails) : item.idDetails;
    } catch (e) {
      console.warn('Invalid ID details format');
    }
    return parsed || {};
  };

  const openImageModal = (uri) => {
    setModalImage(uri);
    setModalVisible(true);
  };

  const renderKYC = item => (
    <View key={item.$id} style={styles.card}>
      <Text style={styles.title}>User ID: {item.userId || item.$id}</Text>
      <Text>Status: {item.status || 'pending'}</Text>
      <Text>ID Type: {item.idType || 'N/A'}</Text>

      <View style={{ marginVertical: 8 }}>
        {Object.entries(filteredIdDetails(item)).map(([key, value]) => (
          <Text key={key} style={{ marginLeft: 8 }}>
            {key.toUpperCase()}: {value || 'N/A'}
          </Text>
        ))}
      </View>

      {item.imageUrl ? (
        <View style={{ marginVertical: 8 }}>
          <Text>Document Image:</Text>
          <TouchableOpacity onPress={() => openImageModal(item.imageUrl)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 200, height: 150, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <Button title="Verify" onPress={() => updateKycStatus(item.$id, 'verified', item.userId)} color="green" />
        <Button title="Reject" onPress={() => updateKycStatus(item.$id, 'rejected', item.userId)} color="red" />
        <Button title="Reverify" onPress={() => updateKycStatus(item.$id, 'pending', item.userId)} color="orange" />
        <Button title="Delete" onPress={() => deleteKyc(item.$id)} color="grey" />
      </View>
    </View>
  );

  const renderTransaction = item => (
    <View key={item.$id} style={styles.txnCard}>
      <Text>User: {item.userId}</Text>
      <Text>Type: {item.type}</Text>
      <Text>Amount: ₦{item.amount}</Text>
      <Text>Status: {item.status}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading admin data...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text>You do not have permission to view this screen.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setSelectedTab('kyc')}
            style={[styles.tabButton, selectedTab === 'kyc' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'kyc' && styles.activeTabText]}>
              KYC Submissions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab('transactions')}
            style={[styles.tabButton, selectedTab === 'transactions' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'transactions' && styles.activeTabText]}>
              Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Content */}
        {selectedTab === 'kyc' ? (
          <>
            {kycList.length > 0 ? (
              kycList.map(renderKYC)
            ) : (
              <Text>No KYC submissions found.</Text>
            )}
          </>
        ) : (
          <>
            {transactions.length > 0 ? (
              transactions.map(renderTransaction)
            ) : (
              <Text>No transactions found.</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <Image
              source={{ uri: modalImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  card: { backgroundColor: '#f0f0f0', padding: 10, marginBottom: 10, borderRadius: 8 },
  txnCard: { backgroundColor: '#e8f5e9', padding: 10, marginBottom: 10, borderRadius: 8 },
  title: { fontWeight: 'bold', marginBottom: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 400,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#16a34a',
  },
  tabText: {
    color: '#374151',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});

export default AdminScreen;
