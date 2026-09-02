import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function DashboardScreen({ navigation }) {
  const { user, activeFestival, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const festivalParam = activeFestival ? `?festival_id=${activeFestival.id}` : '';
      const res = await apiClient.get(`/dashboard/summary/${festivalParam}`);
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [activeFestival]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  const formatCurrency = (val) => `₹${parseFloat(val || 0).toLocaleString('en-IN')}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Banner */}
      <View style={styles.banner}>
        <Text style={styles.badge}>{activeFestival?.name || 'Ganesh Chanda 2026'}</Text>
        <Text style={styles.welcome}>Namaste, {user?.full_name || user?.username} 🙏</Text>
        <Text style={styles.roleText}>Role: {user?.role}</Text>
      </View>

      {/* Metric Cards */}
      <View style={styles.cardRow}>
        <View style={[styles.statCard, { borderLeftColor: '#ea580c' }]}>
          <Text style={styles.statLabel}>Total Collections</Text>
          <Text style={styles.statValue}>{formatCurrency(summary?.total_donations)}</Text>
          <Text style={styles.statSub}>{summary?.donation_count || 0} Receipts</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#059669' }]}>
          <Text style={styles.statLabel}>Available Balance</Text>
          <Text style={styles.statValue}>{formatCurrency(summary?.balance)}</Text>
          <Text style={styles.statSub}>In Treasury</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.statCard, { borderLeftColor: '#2563eb' }]}>
          <Text style={styles.statLabel}>Today's Collection</Text>
          <Text style={styles.statValue}>{formatCurrency(summary?.today?.donations)}</Text>
          <Text style={styles.statSub}>{summary?.today?.donation_count || 0} Today</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#e11d48' }]}>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={styles.statValue}>{formatCurrency(summary?.total_expenses)}</Text>
          <Text style={styles.statSub}>{summary?.expense_count || 0} Entries</Text>
        </View>
      </View>

      {/* Quick Action Button */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('AddDonation')}
      >
        <Text style={styles.actionBtnText}>+ Record New Donation</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#ea580c',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  badge: {
    color: '#fed7aa',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  welcome: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  roleText: {
    color: '#ffedd5',
    fontSize: 12,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  statSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#ea580c',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    marginTop: 24,
    padding: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
