import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const FILTERS = ['All', 'Income', 'Expense'];

const TransactionsScreen = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const docs = await getDocuments('transactions', [{ field: 'user_id', operator: '==', value: user.uid }]);
    let filtered = docs.sort((a, b) => b.date?.localeCompare(a.date) || b.time?.localeCompare(a.time));
    if (filter === 'Income') filtered = filtered.filter(t => t.type === 'sale');
    else if (filter === 'Expense') filtered = filtered.filter(t => t.type === 'expense');
    setTransactions(filtered);
    setLoading(false);
  }, [user, filter]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDocument('transactions', id); fetch(); } },
    ]);
  };

  const groupByDate = (txs) => {
    const groups = {};
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    txs.forEach(tx => {
      let label = tx.date;
      if (tx.date === today) label = 'TODAY';
      else if (tx.date === yesterday) label = 'YESTERDAY';
      if (!groups[label]) groups[label] = [];
      groups[label].push(tx);
    });
    return Object.entries(groups);
  };

  const grouped = groupByDate(transactions);
  const totalIncome = transactions.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: t.colors.successLight }]}>
          <Ionicons name="arrow-up" size={14} color={t.colors.success} />
          <Text style={[styles.summaryText, { color: t.colors.success }]}>+${totalIncome.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: t.colors.dangerLight }]}>
          <Ionicons name="arrow-down" size={14} color={t.colors.danger} />
          <Text style={[styles.summaryText, { color: t.colors.danger }]}>-${totalExpenses.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)} activeOpacity={0.7}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color={t.colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={grouped}
          keyExtractor={([date]) => date}
          renderItem={({ item: [date, items] }) => (
            <View style={styles.section}>
              <Text style={styles.dateHeader}>{date}</Text>
              {items.map(tx => (
                <TouchableOpacity key={tx.id} style={styles.txCard} onLongPress={() => handleDelete(tx.id)} activeOpacity={0.8}>
                  <View style={[styles.txIcon, { backgroundColor: tx.type === 'sale' ? t.colors.successLight : t.colors.dangerLight }]}>
                    <Ionicons name={tx.type === 'sale' ? 'arrow-up-circle' : 'arrow-down-circle'} size={20} color={tx.type === 'sale' ? t.colors.success : t.colors.danger} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txMeta}>{tx.time}{tx.quantity ? ` • Qty: ${tx.quantity}` : ''}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.type === 'sale' ? t.colors.success : t.colors.danger }]}>
                      {tx.type === 'sale' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(tx.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={16} color={t.colors.medium} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={t.colors.medium} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySub}>Tap the + button to add one</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  summaryRow: { flexDirection: 'row', gap: t.spacing.md, padding: t.spacing.lg, paddingBottom: 0 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill },
  summaryText: { fontSize: 14, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800' },
  filterRow: { flexDirection: 'row', padding: t.spacing.lg, paddingBottom: t.spacing.md, gap: t.spacing.sm },
  filterChip: { paddingHorizontal: t.spacing.xl, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  filterChipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  filterText: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium },
  filterTextActive: { color: t.colors.white },
  list: { paddingHorizontal: t.spacing.lg, paddingBottom: 30 },
  section: { marginBottom: t.spacing.xl },
  dateHeader: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 1, marginBottom: t.spacing.md },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: t.radius.card, padding: t.spacing.lg, marginBottom: t.spacing.sm, borderWidth: 1, borderColor: t.colors.border, minHeight: 64, ...t.shadows.sm },
  txIcon: { width: 40, height: 40, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.md },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  txMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', marginBottom: 4 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark, marginTop: t.spacing.lg },
  emptySub: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: t.spacing.xs },
});

export default TransactionsScreen;