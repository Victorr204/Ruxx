import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { saveTransaction } from '../utils/saveTransaction'; // Adjust the path
import { account } from '../appwriteConfig'; // Assuming you're using Appwrite session
import AsyncStorage from '@react-native-async-storage/async-storage';

const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
const suggestedAmounts = [100, 200, 500, 1000, 1500, 2000, 5000, 10000, 20000];

export default function AirtimePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [previousNumbers, setPreviousNumbers] = useState([]);

  useEffect(() => {
    loadPreviousNumbers();
  }, []);

  const loadPreviousNumbers = async () => {
    const stored = await AsyncStorage.getItem('airtime_numbers');
    if (stored) {
      setPreviousNumbers(JSON.parse(stored));
    }
  };

  const savePhoneNumber = async (number) => {
    let updatedList = [number, ...previousNumbers.filter((n) => n !== number)];
    if (updatedList.length > 5) updatedList = updatedList.slice(0, 5); // limit to last 5
    await AsyncStorage.setItem('airtime_numbers', JSON.stringify(updatedList));
    setPreviousNumbers(updatedList);
  };

 const handlePay = () => {
  const amount = selectedAmount || parseInt(customAmount);

  if (!phoneNumber || !network || !amount) {
    Alert.alert('Missing Information', 'Please fill all fields before proceeding.');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid amount.');
    return;
  }

  setConfirmData({ phoneNumber, network, amount });
  setShowModal(true);
};




const confirmPayment = async () => {
  try {
    const user = await account.get(); // ✅ Get user session

    // save transaction after confirmation
    await saveTransaction({
      userId: user.$id,
      serviceType: 'Airtime',
      recipient: confirmData.phoneNumber,
      provider: confirmData.network,
      amount: confirmData.amount,
      status: 'Success'
    });

    savePhoneNumber(confirmData.phoneNumber);
    setShowModal(false);
    alert(`Payment of ₦${confirmData.amount} to ${confirmData.phoneNumber} on ${confirmData.network} sent!`);
  } catch (err) {
    console.error('Transaction log failed', err);
    Alert.alert('Error', err.message);
  }
};



  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Buy Airtime</Text>

        {/* Phone Number */}
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          placeholder="e.g. 08012345678"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          style={styles.input}
        />
        {previousNumbers.length > 0 && (
          <View style={styles.previousList}>
            <Text style={styles.previousLabel}>Previous Numbers:</Text>
            {previousNumbers.map((num) => (
              <TouchableOpacity key={num} onPress={() => setPhoneNumber(num)} style={styles.previousItem}>
                <Text style={styles.previousText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Network Provider */}
        <Text style={styles.label}>Network Provider</Text>
        <View style={styles.networkContainer}>
          {networks.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setNetwork(item)}
              style={[styles.networkButton, network === item && styles.networkButtonSelected]}
            >
              <Text style={[styles.networkText, network === item && styles.networkTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggested Amounts */}
        <Text style={styles.label}>Suggested Amounts</Text>
        <View style={styles.amountGrid}>
          {suggestedAmounts.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setSelectedAmount(item);
                setCustomAmount('');
              }}
              style={[styles.amountButton, selectedAmount === item && styles.amountButtonSelected]}
            >
              <Text style={[styles.amountText, selectedAmount === item && styles.amountTextSelected]}>
                ₦{item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <Text style={styles.label}>Enter Amount</Text>
        <TextInput
          placeholder="e.g. 750"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={(value) => {
            setCustomAmount(value);
            setSelectedAmount(null);
          }}
          style={styles.input}
        />

        {/* Proceed Button */}
        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payButtonText}>Proceed to Pay</Text>
        </TouchableOpacity>

        {/* Green Themed Confirmation Modal */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <Text style={styles.modalText}>Network: {confirmData.network}</Text>
              <Text style={styles.modalText}>Phone: {confirmData.phoneNumber}</Text>
              <Text style={styles.modalText}>Amount: ₦{confirmData.amount}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmPayment} style={styles.modalConfirm}>
                  <Text style={styles.modalConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0fdf4' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'green', textAlign: 'center', marginBottom: 25 },
  label: { fontSize: 16, color: '#14532d', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#166534',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  previousList: { marginBottom: 10 },
  previousLabel: { color: '#14532d', fontSize: 14, marginBottom: 4 },
  previousItem: {
    padding: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 6,
    marginBottom: 4,
  },
  previousText: { color: '#166534' },

  networkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  networkButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    marginRight: 10,
    marginBottom: 10,
  },
  networkButtonSelected: { backgroundColor: '#166534' },
  networkText: { color: '#166534', fontWeight: '600' },
  networkTextSelected: { color: '#fff' },

  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountButton: {
    width: '30%',
    marginVertical: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
  },
  amountButtonSelected: { backgroundColor: '#166534' },
  amountText: { color: '#166534', fontWeight: 'bold' },
  amountTextSelected: { color: '#fff' },

  payButton: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

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
    borderWidth: 2,
    borderColor: '#15803d',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#14532d',
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancel: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#166534',
  },
  modalCancelText: {
    color: '#166534',
    fontWeight: 'bold',
  },
  modalConfirm: {
    padding: 10,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
