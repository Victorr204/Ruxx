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
import { saveTransaction } from '../utils/saveTransaction'; // adjust path
import { account } from '../appwriteConfig'; // ensure Appwrite SDK is properly initialized

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTVPackages } from '../utils/getTVPackages'; // Adjust path

const providers = ['DSTV', 'GOTV', 'Startimes'];

export default function TVPage() {
  const [smartCard, setSmartCard] = useState('');
  const [provider, setProvider] = useState('');
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [previousCards, setPreviousCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreviousCards();
  }, []);

  useEffect(() => {
    if (provider) fetchPlans(provider);
  }, [provider]);

  const loadPreviousCards = async () => {
    const stored = await AsyncStorage.getItem('tv_cards');
    if (stored) setPreviousCards(JSON.parse(stored));
  };

  const saveSmartCard = async (number) => {
    let updated = [number, ...previousCards.filter((n) => n !== number)];
    if (updated.length > 5) updated = updated.slice(0, 5);
    await AsyncStorage.setItem('tv_cards', JSON.stringify(updated));
    setPreviousCards(updated);
  };

  const fetchPlans = async (selectedProvider) => {
    setLoading(true);
    try {
      const data = await getTVPackages(selectedProvider);
      setPlans(data);
      setSelectedPlan(null);
    } catch {
      Alert.alert('Error', 'Failed to load TV plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    const amount = selectedPlan?.price;
    if (!smartCard || !provider || !amount) {
      Alert.alert('Missing Info', 'Please fill all fields');
      return;
    }
    setConfirmData({
      smartCard,
      provider,
      amount,
      plan: selectedPlan.label,
      duration: selectedPlan.duration,
    });
    setShowModal(true);
  };


const confirmPayment = async () => {
  try {
    const user = await account.get();

    // Save smart card to local history
    saveSmartCard(confirmData.smartCard);

    // Log transaction to Appwrite
    await saveTransaction({
      userId: user?.$id,
      serviceType: 'TV',
      recipient: confirmData.smartCard,
      provider: confirmData.provider,
      amount: confirmData.amount,
      status: 'Success',
    });

    setShowModal(false);
    alert(`₦${confirmData.amount} TV subscription sent to ${confirmData.smartCard} on ${confirmData.provider}`);
  } catch (err) {
    Alert.alert('Transaction Failed', err.message);
  }
};


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>TV Subscription</Text>

        <Text style={styles.label}>Smartcard / IUC Number</Text>
        <TextInput
          placeholder="e.g. 2012345678"
          keyboardType="number-pad"
          value={smartCard}
          onChangeText={setSmartCard}
          style={styles.input}
        />
        {previousCards.length > 0 && (
          <View style={styles.previousList}>
            <Text style={styles.previousLabel}>Previous Cards:</Text>
            {previousCards.map((num) => (
              <TouchableOpacity key={num} onPress={() => setSmartCard(num)} style={styles.previousItem}>
                <Text style={styles.previousText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Select TV Provider</Text>
        <View style={styles.networkContainer}>
          {providers.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                setProvider(item);
                setSelectedPlan(null);
              }}
              style={[styles.networkButton, provider === item && styles.networkButtonSelected]}
            >
              <Text style={[styles.networkText, provider === item && styles.networkTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {plans.length > 0 && (
          <View style={styles.planGrid}>
            {plans.map((plan, index) => (
              <TouchableOpacity
                key={`${plan.label}-${index}`}
                onPress={() => setSelectedPlan(plan)}
                style={[styles.planButton, selectedPlan?.label === plan.label && styles.planButtonSelected]}
              >
                <Text style={[styles.planText, selectedPlan?.label === plan.label && styles.planTextSelected]}>
                  {plan.label}
                </Text>
                <Text style={styles.durationText}>{plan.duration}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedPlan && (
          <View style={styles.planInfo}>
            <Text style={styles.planInfoText}>
              Selected: {selectedPlan.label} - {selectedPlan.duration}
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
              <Text style={styles.modalText}>Provider: {confirmData.provider}</Text>
              <Text style={styles.modalText}>Smartcard: {confirmData.smartCard}</Text>
              <Text style={styles.modalText}>Plan: {confirmData.plan}</Text>
              <Text style={styles.modalText}>Amount: ₦{confirmData.amount}</Text>
              <Text style={styles.modalText}>Duration: {confirmData.duration}</Text>
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
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  planButton: {
    width: '48%',
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
  },
  planButtonSelected: { backgroundColor: '#166534' },
  planText: { color: '#166534', fontWeight: 'bold', textAlign: 'center' },
  planTextSelected: { color: '#fff' },
  durationText: { fontSize: 12, color: '#065f46', marginTop: 4 },
  planInfo: { marginTop: 10, marginBottom: 20 },
  planInfoText: { color: '#166534', fontSize: 16, fontWeight: '600' },
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
