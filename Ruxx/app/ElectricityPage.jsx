import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

 import { saveTransaction } from '../utils/saveTransaction'; // Adjust path
import { account } from '../appwriteConfig'; // Make sure you're using Appwrite SDK
import AsyncStorage from '@react-native-async-storage/async-storage';

const discos = [
  'Ikeja Electric',
  'Eko Electric',
  'Abuja Electric',
  'Ibadan Electric',
  'Enugu Electric',
  'Port Harcourt Electric',
  'Jos Electric',
  'Kano Electric',
  'Kaduna Electric',
];

export default function ElectricityPage() {
  const [meterNumber, setMeterNumber] = useState('');
  const [disco, setDisco] = useState('');
  const [meterType, setMeterType] = useState('Prepaid');
  const [amount, setAmount] = useState('');
  const [previousMeters, setPreviousMeters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});

  useEffect(() => {
    loadPreviousMeters();
  }, []);

  const loadPreviousMeters = async () => {
    const stored = await AsyncStorage.getItem('electric_meters');
    if (stored) setPreviousMeters(JSON.parse(stored));
  };

  const saveMeter = async (number) => {
    let updated = [number, ...previousMeters.filter((n) => n !== number)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    await AsyncStorage.setItem('electric_meters', JSON.stringify(updated));
    setPreviousMeters(updated);
  };

  const handlePay = () => {
    if (!meterNumber || !disco || !amount || isNaN(amount)) {
      Alert.alert('Incomplete Info', 'Please fill all fields correctly.');
      return;
    }
    setConfirmData({ meterNumber, disco, meterType, amount });
    setShowModal(true);
  };



const confirmPayment = async () => {
  try {
    const user = await account.get();

    // Save meter number to AsyncStorage
    saveMeter(confirmData.meterNumber);

    // Save transaction to Appwrite
await saveTransaction({
  userId: user?.$id,
  serviceType: 'Electricity',
  recipient: confirmData.meterNumber,
  provider: confirmData.disco,
  amount: parseInt(confirmData.amount), // ✅ convert to integer
  status: 'Success',
});


    setShowModal(false);
    alert(`₦${confirmData.amount} electricity token sent to ${confirmData.meterNumber} (${confirmData.disco})`);
  } catch (err) {
    Alert.alert('Transaction Failed', err.message);
  }
};


return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Electricity Payment</Text>

        <Text style={styles.label}>Meter Number</Text>
        <TextInput
          placeholder="e.g. 1234567890"
          keyboardType="number-pad"
          value={meterNumber}
          onChangeText={setMeterNumber}
          style={styles.input}
        />
        {previousMeters.length > 0 && (
          <View style={styles.previousList}>
            <Text style={styles.previousLabel}>Previous Meters:</Text>
            {previousMeters.map((num) => (
              <TouchableOpacity key={num} onPress={() => setMeterNumber(num)} style={styles.previousItem}>
                <Text style={styles.previousText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Select Disco</Text>
        <View style={styles.networkContainer}>
          {discos.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setDisco(item)}
              style={[styles.networkButton, disco === item && styles.networkButtonSelected]}
            >
              <Text style={[styles.networkText, disco === item && styles.networkTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Meter Type</Text>
        <View style={styles.networkContainer}>
          {['Prepaid', 'Postpaid'].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setMeterType(type)}
              style={[styles.networkButton, meterType === type && styles.networkButtonSelected]}
            >
              <Text style={[styles.networkText, meterType === type && styles.networkTextSelected]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount (₦)</Text>
        <TextInput
          placeholder="e.g. 5000"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />

        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payButtonText}>Proceed to Pay</Text>
        </TouchableOpacity>

        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <Text style={styles.modalText}>Meter: {confirmData.meterNumber}</Text>
              <Text style={styles.modalText}>Disco: {confirmData.disco}</Text>
              <Text style={styles.modalText}>Type: {confirmData.meterType}</Text>
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
  </SafeAreaView>
);

}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0fdf4' },
  container: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'green', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, color: '#14532d', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#166534',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
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
  payButton: {
    backgroundColor: '#15803d',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#15803d', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 16, color: '#14532d', marginBottom: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalCancel: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#166534',
  },
  modalCancelText: { color: '#166534', fontWeight: 'bold' },
  modalConfirm: { padding: 10, backgroundColor: '#15803d', borderRadius: 8 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' },
});
