import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import apiClient from '../api/client';

export default function DonationsScreen({ navigation }) {
  const [donations, setDonations] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDonations = async () => {
    try {
      const url = search ? `/donations/?search=${encodeURIComponent(search)}` : '/donations/';
      const res = await apiClient.get(url);
      setDonations(res.data.results || res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDonations();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Receipt', { donation: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.donorName}>{item.donor_name}</Text>
        <Text style={styles.amount}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.receiptNo}>{item.receipt?.receipt_number}</Text>
        <Text style={styles.meta}>{item.donation_date} • {item.payment_method_display || item.payment_method}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by donor or receipt #..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={donations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No donations found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: { padding: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', borderRadius: 10, padding: 10, fontSize: 13 },
  list: { padding: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  donorName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  amount: { fontSize: 16, fontWeight: '900', color: '#ea580c' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  receiptNo: { fontSize: 11, fontWeight: 'bold', color: '#78350f', backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  meta: { fontSize: 11, color: '#64748b' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
