import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getDocuments, deleteDocument, updateDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';
import Toast from '../components/Toast';
import ReceiptModal from '../components/ReceiptModal';
import Modal from '../components/Modal';
import { useFormat } from '../utils/format';

const FILTERS = ['All', 'Income', 'Expense'];

const TransactionsScreen = ({ refreshKey }) => {
  const { user, activeBusinessId } = useAuth();
  const { formatCurrency, formatDate } = useFormat();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const fetch = useCallback(async (isRefresh = false) => {
    if (!user || !activeBusinessId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const docs = await getDocuments('transactions', [{ field: 'business_id', operator: '==', value: activeBusinessId }]);
    let filtered = docs.sort((a, b) => b.date?.localeCompare(a.date) || b.time?.localeCompare(a.time));
    if (filter === 'Income') filtered = filtered.filter(x => x.type === 'sale');
    else if (filter === 'Expense') filtered = filtered.filter(x => x.type === 'expense');
    setTransactions(filtered);
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [user, activeBusinessId, filter]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  useEffect(() => {
    if (refreshKey > 0) {
      fetch();
    }
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'sale' && deleteTarget.items?.length > 0) {
        for (const item of deleteTarget.items) {
          const inventoryItems = await getDocuments('inventory', [{ field: 'business_id', operator: '==', value: activeBusinessId }]);
          const invItem = inventoryItems.find(i => i.id === item.item_id);
          if (invItem) {
            const newStock = invItem.current_stock + item.quantity;
            await updateDocument('inventory', invItem.id, { current_stock: newStock });
          }
        }
      }
      await deleteDocument('transactions', deleteTarget.id);
      setDeleteTarget(null);
      showToast('Transaction deleted, stock restored', 'success');
      fetch();
    } catch {
      showToast('Failed to delete transaction', 'error');
    }
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
  const totalIncome = transactions.filter(x => x.type === 'sale').reduce((s, x) => s + x.amount, 0);
  const totalExpenses = transactions.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0);

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={t.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: t.colors.successLight }]}>
          <Ionicons name="arrow-up" size={14} color={t.colors.success} />
          <Text style={[styles.summaryText, { color: t.colors.success }]}>+{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: t.colors.dangerLight }]}>
          <Ionicons name="arrow-down" size={14} color={t.colors.danger} />
          <Text style={[styles.summaryText, { color: t.colors.danger }]}>-{formatCurrency(totalExpenses)}</Text>
        </View>
      </View>
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)} activeOpacity={0.7}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={grouped}
        keyExtractor={([date]) => date}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} />}
        renderItem={({ item: [date, items] }) => (
          <View style={styles.section}>
            <Text style={styles.dateHeader}>{date}</Text>
            {items.map(tx => (
              <TouchableOpacity
                key={tx.id}
                style={styles.txCard}
                onPress={() => setSelectedTransaction(tx)}
                activeOpacity={0.8}
              >
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'sale' ? t.colors.successLight : t.colors.dangerLight }]}>
                  <Ionicons name={tx.type === 'sale' ? 'arrow-up-circle' : 'arrow-down-circle'} size={20} color={tx.type === 'sale' ? t.colors.success : t.colors.danger} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName} numberOfLines={1}>
                    {tx.items && tx.items.length > 0 ? tx.items.map(i => `${i.name} x${i.quantity}`).join(', ') : tx.description}
                  </Text>
                  <Text style={styles.txMeta}>{formatDate(tx.date)} • {tx.time}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: tx.type === 'sale' ? t.colors.success : t.colors.danger }]}>
                    {tx.type === 'sale' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                  <TouchableOpacity onPress={() => setDeleteTarget(tx)} style={styles.deleteBtn}>
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

      <ReceiptModal
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        receiptData={selectedTransaction}
      />

      <Modal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Transaction"
      >
        {deleteTarget && (
          <View>
            <Text style={styles.modalText}>
              Are you sure you want to delete this transaction?
            </Text>
            <Text style={styles.modalSubtext}>
              {formatCurrency(deleteTarget.amount)} • {deleteTarget.description}
            </Text>
            {deleteTarget.items && deleteTarget.items.length > 0 && (
              <View style={styles.restoreList}>
                <Text style={styles.restoreTitle}>Items to restore:</Text>
                {deleteTarget.items.map((item, index) => (
                  <Text key={index} style={styles.restoreItem}>
                    {item.name} x{item.quantity}
                  </Text>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleDelete}>
                <Text style={styles.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.background },
  summaryRow: { flexDirection: 'row', gap: t.spacing.md, padding: t.spacing.lg, paddingBottom: 0 },
  summaryChip: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill },
  summaryText: { fontSize: 14, fontFamily: t.typography.heading, fontWeight: '800' },
  filterRow: { flexDirection: 'row', padding: t.spacing.lg, paddingBottom: t.spacing.md, gap: t.spacing.sm },
  filterChip: { paddingHorizontal: t.spacing.xl, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  filterChipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  filterText: { fontSize: 13, fontFamily: t.typography.bodyMedium, fontWeight: '500', color: t.colors.medium },
  filterTextActive: { color: t.colors.white },
  list: { paddingHorizontal: t.spacing.lg, paddingBottom: 30 },
  section: { marginBottom: t.spacing.xl },
  dateHeader: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 1, marginBottom: t.spacing.md },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: t.radius.card, padding: t.spacing.lg, marginBottom: t.spacing.sm, borderWidth: 1, borderColor: t.colors.border, ...t.shadows.sm },
  txIcon: { width: 40, height: 40, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.md },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  txMeta: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontFamily: t.typography.heading, fontWeight: '800', marginBottom: 4 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark, marginTop: t.spacing.lg },
  emptySub: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium, marginTop: t.spacing.xs },
  modalText: { fontSize: 15, fontFamily: t.typography.body, color: t.colors.dark, marginBottom: 8 },
  modalSubtext: { fontSize: 14, fontFamily: t.typography.bodySemiBold, color: t.colors.medium, marginBottom: 16 },
  restoreList: { marginBottom: 16 },
  restoreTitle: { fontSize: 14, fontFamily: t.typography.bodyBold, color: t.colors.primary, marginBottom: 4 },
  restoreItem: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.dark, paddingVertical: 2 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.medium },
  confirmBtn: { flex: 1, backgroundColor: t.colors.danger, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.white },
});

export default TransactionsScreen;