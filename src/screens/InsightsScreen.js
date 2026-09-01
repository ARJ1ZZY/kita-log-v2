import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Dimensions, TextInput, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { addDocument, getDocuments, deleteDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import CustomLineChart from '../components/CustomLineChart';
import { useFormat } from '../utils/format';

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 80;
const BUDGET_CATEGORIES = ['Marketing', 'Rent & Utilities', 'Supplies', 'Travel', 'Subscriptions'];
const CHART_PLACEHOLDER = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], sales: [0,0,0,0,0,0,0], expenses: [0,0,0,0,0,0,0] };

const InsightsScreen = () => {
  const { user, activeBusinessId } = useAuth();
  const { formatCurrency } = useFormat();
  const [tab, setTab] = useState('analytics');
  const [stats, setStats] = useState({ sales: 0, expenses: 0, dailyData: CHART_PLACEHOLDER });
  const [budgets, setBudgets] = useState([]);
  const [budgetModal, setBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category_id: BUDGET_CATEGORIES[0], amount: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const fetch = useCallback(async (isRefresh = false) => {
    if (!user || !activeBusinessId) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const q = query(collection(db, 'transactions'), where('business_id', '==', activeBusinessId));
    const snap = await getDocs(q);
    let sales = 0, expenses = 0; const dMap = {};
    snap.forEach(doc => {
      const d = doc.data();
      if (d.date >= `${monthStr}-01`) {
        if (d.type === 'sale') sales += d.amount; else expenses += d.amount;
        const day = d.date?.substring(5); if (!dMap[day]) dMap[day] = { sales: 0, expenses: 0 };
        if (d.type === 'sale') dMap[day].sales += d.amount; else dMap[day].expenses += d.amount;
      }
    });
    const sDays = Object.keys(dMap).sort();
    setStats({
      sales,
      expenses,
      dailyData: sDays.length ? {
        labels: sDays.map(d => d.substring(5)),
        sales: sDays.map(d => dMap[d].sales),
        expenses: sDays.map(d => dMap[d].expenses),
      } : CHART_PLACEHOLDER,
    });

    const bDocs = await getDocuments('budgets', [{ field: 'business_id', operator: '==', value: activeBusinessId }, { field: 'month', operator: '==', value: monthStr }]);
    const spentMap = {}; snap.forEach(doc => { const d = doc.data(); if (d.date >= `${monthStr}-01` && d.type === 'expense') spentMap[d.category_id || 'Other'] = (spentMap[d.category_id || 'Other'] || 0) + d.amount; });
    setBudgets(BUDGET_CATEGORIES.map(cat => { const found = bDocs.find(b => b.category_id === cat); return { id: found?.id, name: cat, limit: found?.amount || 0, spent: spentMap[cat] || 0 }; }));
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [user, activeBusinessId]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleAddBudget = async () => {
    const amt = parseFloat(budgetForm.amount);
    if (!budgetForm.category_id || isNaN(amt) || amt <= 0) { showToast('Enter valid amount', 'error'); return; }
    const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await addDocument('budgets', { business_id: activeBusinessId, category_id: budgetForm.category_id, month: monthStr, amount: amt, created_at: new Date().toISOString() });
    setBudgetModal(false); setBudgetForm({ category_id: BUDGET_CATEGORIES[0], amount: '' }); fetch();
    showToast('Budget added', 'success');
  };

  const handleDeleteBudget = (item) => {
    if (!item.id) return;
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${item.name} budget?`)) {
        deleteDocument('budgets', item.id).then(() => { showToast('Budget deleted', 'success'); fetch(); }).catch(() => showToast('Failed to delete', 'error'));
      }
    } else {
      deleteDocument('budgets', item.id).then(() => { showToast('Budget deleted', 'success'); fetch(); }).catch(() => showToast('Failed to delete', 'error'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'analytics' && styles.tabActive]} onPress={() => setTab('analytics')}>
          <Text style={[styles.tabText, tab === 'analytics' && styles.tabTextActive]}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'budgets' && styles.tabActive]} onPress={() => setTab('budgets')}>
          <Text style={[styles.tabText, tab === 'budgets' && styles.tabTextActive]}>Budgets</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} />}>
        {tab === 'analytics' ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>This Month</Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}><Text style={styles.heroVal}>{formatCurrency(stats.sales)}</Text><Text style={styles.heroMeta}>Revenue</Text></View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}><Text style={styles.heroVal}>{formatCurrency(stats.expenses)}</Text><Text style={styles.heroMeta}>Expenses</Text></View>
              </View>
            </View>
            {stats.sales === 0 && stats.expenses === 0 && (
              <View style={styles.placeholderBanner}>
                <Ionicons name="analytics-outline" size={32} color={t.colors.primary} />
                <Text style={styles.placeholderTitle}>Analytics Preview</Text>
                <Text style={styles.placeholderDesc}>Add transactions to see trends.</Text>
              </View>
            )}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Revenue vs Expenses (7 Day)</Text>
              <CustomLineChart
                labels={stats.dailyData.labels.slice(-7)}
                sales={stats.dailyData.sales.slice(-7)}
                expenses={stats.dailyData.expenses.slice(-7)}
                width={CHART_WIDTH}
                height={220}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.budgetHeaderRow}>
              <Text style={styles.sectionTitle}>Monthly Budgets</Text>
              <TouchableOpacity style={styles.addBudgetBtn} onPress={() => setBudgetModal(true)}>
                <Ionicons name="add" size={18} color={t.colors.white} />
                <Text style={styles.addBudgetText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthLabel}>Budget Health</Text>
              <Text style={styles.healthValue}>{formatCurrency(budgets.reduce((s,b) => s + b.limit,0) - budgets.reduce((s,b) => s + b.spent,0))}</Text>
              <Text style={styles.healthMeta}>Remaining This Month</Text>
            </View>
            {budgets.filter(b => b.limit > 0).length === 0 && (
              <View style={styles.placeholderBanner}>
                <Ionicons name="wallet-outline" size={32} color={t.colors.secondary} />
                <Text style={styles.placeholderTitle}>No Budgets Set</Text>
                <Text style={styles.placeholderDesc}>Tap Add to set limits.</Text>
              </View>
            )}
            {budgets.map(b => {
              if (b.limit === 0) return null;
              const pct = Math.min(Math.round((b.spent / b.limit) * 100), 100);
              const over = b.spent > b.limit;
              return (
                <TouchableOpacity key={b.name} style={styles.budgetCard} onLongPress={() => handleDeleteBudget(b)}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetName}>{b.name}</Text>
                    <Text style={[styles.budgetPct, { color: over ? t.colors.danger : t.colors.primary }]}>{pct}%</Text>
                  </View>
                  <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: over ? t.colors.danger : t.colors.primary }]} /></View>
                  <Text style={styles.budgetMeta}>{formatCurrency(b.spent)} of {formatCurrency(b.limit)}</Text>
                  <TouchableOpacity onPress={() => handleDeleteBudget(b)} style={styles.deleteChip}>
                    <Ionicons name="trash-outline" size={12} color={t.colors.medium} />
                    <Text style={styles.deleteChipText}>Delete</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal visible={budgetModal} onClose={() => setBudgetModal(false)} title="New Budget">
        <View style={styles.modalContent}>
          <View style={styles.inputGroup}><Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>
              {BUDGET_CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, budgetForm.category_id === c && styles.chipActive]} onPress={() => setBudgetForm({...budgetForm, category_id: c})}>
                  <Text style={[styles.chipText, budgetForm.category_id === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View></ScrollView>
          </View>
          <View style={styles.inputGroup}><Text style={styles.label}>Budget Amount</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={budgetForm.amount} onChangeText={x => setBudgetForm({...budgetForm, amount: x})} placeholder="0.00" placeholderTextColor={t.colors.medium} /></View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddBudget}><Text style={styles.saveText}>Set Budget</Text></TouchableOpacity>
        </View>
      </Modal>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.background },
  tabRow: { flexDirection: 'row', margin: t.spacing.lg, marginBottom: 0, backgroundColor: t.colors.surface, borderRadius: t.radius.button, padding: 4, borderWidth: 1, borderColor: t.colors.border },
  tab: { flex: 1, paddingVertical: t.spacing.md, alignItems: 'center', borderRadius: t.radius.input },
  tabActive: { backgroundColor: t.colors.primary },
  tabText: { fontSize: 14, fontFamily: t.typography.bodySemiBold, color: t.colors.medium },
  tabTextActive: { color: t.colors.white },
  scroll: { padding: t.spacing.lg, paddingBottom: 100 },
  heroCard: { backgroundColor: t.colors.primary, borderRadius: 24, padding: t.spacing.xxl, marginBottom: t.spacing.lg, alignItems: 'center' },
  heroLabel: { fontSize: 13, fontFamily: t.typography.bodyMedium, color: t.colors.white, opacity: 0.8, marginBottom: t.spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxl },
  heroStat: { alignItems: 'center' },
  heroVal: { fontSize: 22, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.white },
  heroMeta: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.white, opacity: 0.7, marginTop: 4 },
  heroDivider: { width: 1, height: 40, backgroundColor: t.colors.white, opacity: 0.3 },
  placeholderBanner: { backgroundColor: t.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, alignItems: 'center', marginBottom: t.spacing.lg, ...t.shadows.sm },
  placeholderTitle: { fontSize: 16, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginTop: t.spacing.md },
  placeholderDesc: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium, textAlign: 'center', marginTop: t.spacing.sm },
  chartCard: { backgroundColor: t.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, ...t.shadows.sm, overflow: 'hidden' },
  chartTitle: { fontSize: 16, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginBottom: t.spacing.lg },
  budgetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  sectionTitle: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  addBudgetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.colors.primary, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm, borderRadius: t.radius.button },
  addBudgetText: { color: t.colors.white, fontSize: 14, fontFamily: t.typography.bodySemiBold },
  healthCard: { backgroundColor: t.colors.primary, borderRadius: 24, padding: t.spacing.xxl, marginBottom: t.spacing.lg, alignItems: 'center' },
  healthLabel: { fontSize: 13, fontFamily: t.typography.bodyMedium, color: t.colors.white, opacity: 0.8 },
  healthValue: { fontSize: 32, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.white, marginTop: t.spacing.sm },
  healthMeta: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.white, opacity: 0.7, marginTop: 4 },
  budgetCard: { backgroundColor: t.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
  budgetName: { fontSize: 15, fontFamily: t.typography.bodySemiBold, color: t.colors.dark },
  budgetPct: { fontSize: 14, fontFamily: t.typography.heading, fontWeight: '800' },
  progressBar: { height: 10, backgroundColor: t.colors.border, borderRadius: t.radius.pill, overflow: 'hidden', marginBottom: t.spacing.sm },
  progressFill: { height: '100%', borderRadius: t.radius.pill },
  budgetMeta: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.medium },
  deleteChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: t.spacing.sm },
  deleteChipText: { fontSize: 11, fontFamily: t.typography.body, color: t.colors.medium },
  modalContent: { marginTop: t.spacing.sm },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 48 },
  chipRow: { flexDirection: 'row', gap: t.spacing.sm },
  chip: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { fontSize: 12, fontFamily: t.typography.bodyMedium, color: t.colors.medium },
  chipTextActive: { color: t.colors.white },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginTop: t.spacing.sm },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
});

export default InsightsScreen;