import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const PAYMENT_METHODS = [
  { label: 'Cash', value: 'CASH' },
  { label: 'PhonePe', value: 'PHONEPE' },
  { label: 'Google Pay', value: 'GPAY' },
  { label: 'UPI / QR', value: 'UPI' },
  { label: 'Bank', value: 'BANK' },
];

export default function AddDonationScreen({ navigation }) {
  const { activeFestival } = useAuth();
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!donorName.trim()) {
      Alert.alert('Validation', 'Please enter donor name');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // 1. Create donor
      const donorRes = await apiClient.post('/donors/', {
        name: donorName.trim(),
        mobile_number: donorMobile.trim(),
      });

      // 2. Create donation
      const donationRes = await apiClient.post('/donations/', {
        festival: activeFestival?.id,
        donor: donorRes.data.id,
        amount: parseFloat(amount).toFixed(2),
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        donation_date: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
      });

      // Navigate to Receipt screen with created donation
      navigation.replace('Receipt', { donation: donationRes.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>Devotee Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name (e.g. Ramesh Kumar) *"
        value={donorName}
        onChangeText={setDonorName}
      />
      <TextInput
        style={styles.input}
        placeholder="10-digit Mobile Number (Optional)"
        value={donorMobile}
        onChangeText={setDonorMobile}
        keyboardType="phone-pad"
      />

      <Text style={styles.sectionHeader}>Contribution Amount (₹) *</Text>
      <TextInput
        style={[styles.input, styles.amountInput]}
        placeholder="₹ 1000"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.sectionHeader}>Payment Method</Text>
      <View style={styles.methodRow}>
        {PAYMENT_METHODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[
              styles.methodChip,
              paymentMethod === m.value && styles.methodChipActive,
            ]}
            onPress={() => setPaymentMethod(m.value)}
          >
            <Text
              style={[
                styles.methodText,
                paymentMethod === m.value && styles.methodTextActive,
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentMethod !== 'CASH' && (
        <>
          <Text style={styles.sectionHeader}>Transaction / UTR Reference</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. TXN123456789"
            value={transactionId}
            onChangeText={setTransactionId}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Generate Receipt & Save</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ea580c',
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  methodChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  methodChipActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  methodText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#ea580c',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
