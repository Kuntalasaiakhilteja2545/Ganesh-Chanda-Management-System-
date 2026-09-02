import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';

export default function ReceiptScreen({ route, navigation }) {
  const { donation } = route.params || {};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🕉️ Ganesh Chanda Official Receipt\nReceipt No: ${donation?.receipt?.receipt_number}\nDonor: ${donation?.donor_name}\nAmount: ₹${donation?.amount}\nPayment: ${donation?.payment_method}\nDate: ${donation?.donation_date}\n\nThank you for your blessed contribution! 🙏`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.receiptCard}>
        <Text style={styles.om}>🕉️</Text>
        <Text style={styles.festivalName}>
          {donation?.festival_name || 'Ganesh Chanda 2026'}
        </Text>
        <Text style={styles.receiptType}>Official Donation Receipt</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Receipt No:</Text>
          <Text style={styles.receiptNo}>{donation?.receipt?.receipt_number}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Donor Name:</Text>
          <Text style={styles.valueBold}>{donation?.donor_name}</Text>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Contribution Amount</Text>
          <Text style={styles.amountValue}>₹{parseFloat(donation?.amount || 0).toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={styles.value}>{donation?.payment_method_display || donation?.payment_method}</Text>
        </View>

        {donation?.transaction_id ? (
          <View style={styles.row}>
            <Text style={styles.label}>Txn ID / UTR:</Text>
            <Text style={styles.valueMono}>{donation?.transaction_id}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{donation?.donation_date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Collected By:</Text>
          <Text style={styles.value}>{donation?.collected_by_name || 'Committee'}</Text>
        </View>

        <Text style={styles.footerNote}>🙏 Ganpati Bappa Morya! 🙏</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share Digital Receipt 📲</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('DashboardTab')}
        >
          <Text style={styles.doneBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20, justifyContent: 'center' },
  receiptCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#fcd34d',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  om: { fontSize: 32, textAlign: 'center', marginBottom: 4 },
  festivalName: { fontSize: 18, fontWeight: '900', color: '#78350f', textAlign: 'center' },
  receiptType: { fontSize: 11, fontWeight: 'bold', color: '#b45309', textAlign: 'center', textTransform: 'uppercase', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#fde68a', marginVertical: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 12, color: '#92400e', fontWeight: '500' },
  value: { fontSize: 12, color: '#1e293b', fontWeight: '600' },
  valueBold: { fontSize: 14, color: '#0f172a', fontWeight: 'bold' },
  valueMono: { fontSize: 12, color: '#0f172a', fontFamily: 'monospace' },
  receiptNo: { fontSize: 12, fontWeight: 'bold', color: '#78350f', backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  amountBox: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  amountLabel: { fontSize: 11, fontWeight: 'bold', color: '#fed7aa', textTransform: 'uppercase' },
  amountValue: { fontSize: 26, fontWeight: '900', color: '#ffffff', marginTop: 2 },
  footerNote: { textAlign: 'center', color: '#b45309', fontSize: 12, fontStyle: 'italic', marginTop: 12 },
  actions: { marginTop: 24, gap: 10 },
  shareBtn: { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  shareBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  doneBtn: { backgroundColor: '#e2e8f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { color: '#334155', fontSize: 15, fontWeight: 'bold' },
});
