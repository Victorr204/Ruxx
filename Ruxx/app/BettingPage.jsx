import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Modal, StyleSheet, ScrollView,
} from 'react-native';
import { verifyBetAccount, payBetAccount } from '../utils/betApi';
 import { saveTransaction } from '../utils/saveTransaction'; // adjust the path

const providers = ['Bet9ja', 'Nairabet'];

export default function BettingPage() {
  const [provider, setProvider] = useState('');
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const handleVerify = async () => {
    if (!provider || !userId || !amount) {
      Alert.alert('Missing Info', 'Fill all fields first');
      return;
    }

    try {
      const user = await verifyBetAccount(userId, provider);
      setConfirmData({ ...user, provider, userId, amount });
      setShowModal(true);
    } catch (err) {
      Alert.alert('Verification Failed', err.message);
    }
  };


 

const confirmPayment = async () => {
  try {
     // Optional: fetch user if not already available in state
        const user = await account.get();

    const res = await payBetAccount(confirmData);
    
    await saveTransaction({
      userId: user?.$id, // Make sure `user` is fetched from Appwrite
      serviceType: 'Betting',
      recipient: confirmData.accountNumber || confirmData.phoneNumber,
      provider: confirmData.provider || confirmData.network,
      amount: confirmData.amount,
      status: 'Success',
    });

    setShowModal(false);
    Alert.alert('Success', `Transaction ID: ${res.transactionId}`);
  } catch (err) {
    Alert.alert('Payment Failed', err.message);
  }
};

  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Betting Wallet Top-Up</Text>

      <Text style={styles.label}>Select Provider</Text>
      <View style={styles.row}>
        {providers.map((prov) => (
          <TouchableOpacity
            key={prov}
            onPress={() => setProvider(prov)}
            style={[styles.button, provider === prov && styles.buttonSelected]}
          >
            <Text style={[styles.buttonText, provider === prov && styles.buttonTextSelected]}>{prov}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>User ID / Wallet ID</Text>
      <TextInput
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
        placeholder="e.g. 123456"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        placeholder="₦"
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.proceedButton} onPress={handleVerify}>
        <Text style={styles.proceedText}>Verify and Continue</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.modalText}>User: {confirmData?.fullName}</Text>
            <Text style={styles.modalText}>Username: {confirmData?.username}</Text>
            <Text style={styles.modalText}>Provider: {confirmData?.provider}</Text>
            <Text style={styles.modalText}>Wallet ID: {confirmData?.userId}</Text>
            <Text style={styles.modalText}>Amount: ₦{confirmData?.amount}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmPayment} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0fdf4', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#15803d', marginBottom: 20 },
  label: { color: '#166534', marginBottom: 6, marginTop: 10, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#166534',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    marginRight: 10,
  },
  buttonSelected: { backgroundColor: '#166534' },
  buttonText: { color: '#166534', fontWeight: 'bold' },
  buttonTextSelected: { color: '#fff' },
  proceedButton: {
    backgroundColor: '#15803d',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  proceedText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 12,
    borderColor: '#15803d',
    borderWidth: 2,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#15803d', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#14532d', marginVertical: 2 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 10, borderColor: '#15803d', borderWidth: 1, borderRadius: 8 },
  confirmBtn: { padding: 10, backgroundColor: '#15803d', borderRadius: 8 },
  cancelText: { color: '#15803d', fontWeight: 'bold' },
  confirmText: { color: '#fff', fontWeight: 'bold' },
});
