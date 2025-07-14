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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDataPlans } from '../utils/getDataPlans'; // Simulated API
import { saveTransaction } from '../utils/saveTransaction'; // adjust path if needed
import { account } from '../appwriteConfig';

const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];

export default function DataPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [plansByCategory, setPlansByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [previousNumbers, setPreviousNumbers] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    loadPreviousNumbers();
  }, []);

  useEffect(() => {
    if (network) fetchPlans(network);
  }, [network]);

  const loadPreviousNumbers = async () => {
    const stored = await AsyncStorage.getItem('data_numbers');
    if (stored) setPreviousNumbers(JSON.parse(stored));
  };

  const savePhoneNumber = async (number) => {
    let updated = [number, ...previousNumbers.filter((n) => n !== number)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    await AsyncStorage.setItem('data_numbers', JSON.stringify(updated));
    setPreviousNumbers(updated);
  };

  const fetchPlans = async (selectedNetwork) => {
    setLoadingPlans(true);
    try {
      const data = await getDataPlans(selectedNetwork);
      const grouped = data.reduce((acc, plan) => {
        const category = plan.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(plan);
        return acc;
      }, {});
      setPlansByCategory(grouped);
      const firstCategory = Object.keys(grouped)[0];
      setSelectedCategory(firstCategory);
      setSelectedPlan(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch data plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const getCurrentPlans = () => plansByCategory[selectedCategory] || [];

  const handlePay = () => {
    const amount = selectedPlan?.price;
    if (!phoneNumber || !network || !amount) {
      Alert.alert('Missing Information', 'Please fill all fields before proceeding.');
      return;
    }

    setConfirmData({
      phoneNumber,
      network,
      amount,
      plan: selectedPlan?.label,
      validity: selectedPlan?.validity,
    });
    setShowModal(true);
  };

const confirmPayment = async () => {
  try {
     // Optional: fetch user if not already available in state
        const user = await account.get();

    savePhoneNumber(confirmData.phoneNumber);
    setShowModal(false);
    
    await saveTransaction({
      userId: user?.$id,
      serviceType: 'Data',
      recipient: confirmData.phoneNumber,
      provider: confirmData.network,
      amount: confirmData.amount,
      status: 'Success',
    });

    alert(`₦${confirmData.amount} data plan sent to ${confirmData.phoneNumber} on ${confirmData.network}`);
  } catch (err) {
    console.error('Transaction log failed', err);
    alert('Transaction completed, but failed to log history.');
  }
};

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Buy Data</Text>

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

        <Text style={styles.label}>Network Provider</Text>
        <View style={styles.networkContainer}>
          {networks.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setNetwork(item);
                setSelectedPlan(null);
              }}
              style={[styles.networkButton, network === item && styles.networkButtonSelected]}
            >
              <Text style={[styles.networkText, network === item && styles.networkTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {network && (
          <>
            <Text style={styles.label}>Select Plan Category</Text>
            <View style={styles.categoryRow}>
              {Object.keys(plansByCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    setSelectedCategory(category);
                    setSelectedPlan(null);
                  }}
                  style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonSelected]}
                >
                  <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextSelected]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.planGrid}>
              {getCurrentPlans().map((plan) => (
                <TouchableOpacity
                  key={`${plan.label}-${plan.price}-${plan.validity}`}
                  onPress={() => setSelectedPlan(plan)}
                  style={[styles.planButton, selectedPlan?.label === plan.label && styles.planButtonSelected]}
                >
                  <Text style={[styles.planText, selectedPlan?.label === plan.label && styles.planTextSelected]}>
                    {plan.label} - ₦{plan.price}
                  </Text>
                  <Text style={styles.validityText}>{plan.validity}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {selectedPlan && (
          <View style={styles.planInfo}>
            <Text style={styles.planInfoText}>
              Selected: {selectedPlan.label} - {selectedPlan.validity}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payButtonText}>Proceed to Pay</Text>
        </TouchableOpacity>

        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <Text style={styles.modalText}>Network: {confirmData.network}</Text>
              <Text style={styles.modalText}>Phone: {confirmData.phoneNumber}</Text>
              <Text style={styles.modalText}>Plan: {confirmData.plan}</Text>
              <Text style={styles.modalText}>Amount: ₦{confirmData.amount}</Text>
              <Text style={styles.modalText}>Validity: {confirmData.validity}</Text>
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
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
  },
  categoryButtonSelected: { backgroundColor: '#15803d' },
  categoryText: { color: '#166534', fontWeight: 'bold' },
  categoryTextSelected: { color: '#fff' },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  planButton: {
    width: '48%',
    marginVertical: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
  },
  planButtonSelected: { backgroundColor: '#166534' },
  planText: { color: '#166534', fontWeight: 'bold' },
  planTextSelected: { color: '#fff' },
  validityText: { fontSize: 12, color: '#065f46', marginTop: 4 },
  planInfo: { marginTop: 10, marginBottom: 20 },
  planInfoText: { color: '#166534', fontSize: 16, fontWeight: '600' },
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
  modalCancelText: { color: '#166534', fontWeight: 'bold' },
  modalConfirm: {
    padding: 10,
    backgroundColor: '#15803d',
    borderRadius: 8,
  },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' },
});
