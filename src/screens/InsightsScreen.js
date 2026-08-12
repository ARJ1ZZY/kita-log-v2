import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Dimensions, TextInput, Alert, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { addDocument, getDocuments, deleteDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';
import Modal from '../components/Modal';

const screenWidth = Dimensions.get('window').width - 32;
const BUDGET_CATEGORIES = ['Marketing', 'Rent & Utilities', 'Supplies', 'Travel', 'Subscriptions'];
const CHART_PLACEHOLDER = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], sales: [0, 0, 0, 0, 0, 0, 0], expenses: [0, 0, 0, 0, 0, 0, 0] };

const InsightsScreen = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('analytics');
  const [stats, setStats] = useState({ sales: 0, expenses: 0, dailyData: CHART_PLACEHOLDER });
  const [budgets, setBudgets] = useState([]);
  const [budgetModal, setBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category_id: BUDGET_CATEGORIES[0], amount: '' });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '', type: 'success' }));
  };

  const fetch = useCallback(async () => {
    if (!user) return;
    const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const q = query(collection(db, 'transactions'), where('user_id', '==', user.uid));
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
    setStats({ sales, expenses, dailyData: sDays.length > 0 ? { labels: sDays.map(d => d.substring(5)), sales: sDays.map(d => dMap[d].sales), expenses: sDays.map(d => dMap[d].expenses) } : CHART_PLACEHOLDER });

    const bDocs = await getDocuments('budgets', [{ field: 'user_id', operator: '==', value: user.uid }, { field: 'month', operator: '==', value: monthStr }]);
    const spentMap = {}; snap.forEach(doc => { const d = doc.data(); if (d.date >= `${monthStr}-01` && d.type === 'expense') spentMap[d.category_id || 'Other'] = (spentMap[d.category_id || 'Other'] || 0) + d.amount; });
    setBudgets(BUDGET_CATEGORIES.map(cat => {
      const found = bDocs.find(b => b.category_id === cat);
      return { id: found?.id, name: cat, limit: found?.amount || 0, spent: spentMap[cat] || 0 };
    }));
  }, [user]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleAddBudget = async () => {
    const amt = parseFloat(budgetForm.amount);
    if (!budgetForm.category_id || isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await addDocument('budgets', { user_id: user.uid, category_id: budgetForm.category_id, month: monthStr, amount: amt, created_at: new Date().toISOString() });
    setBudgetModal(false); setBudgetForm({ category_id: BUDGET_CATEGORIES[0], amount: '' }); fetch();
    showToast('Budget added successfully', 'success');
  };

  const handleDeleteBudget = (item) => {
    if (!item.id) return;
    Alert.alert('Delete Budget', `Remove "${item.name}" budget?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteDocument('budgets', item.id);
          fetch();
          showToast(`"${item.name}" budget deleted`, 'success');
        } catch {
          showToast('Failed to delete budget', 'error');
        }
      }},
    ]);
  };

  const chartConfig = { backgroundColor: t.colors.surface, backgroundGradientFrom: t.colors.surface, backgroundGradientTo: t.colors.surface, decimalPlaces: 0, color: (o = 1) => `rgba(37,99,235,${o})`, labelColor: () => t.colors.medium };
  const hasRealData = stats.sales > 0 || stats.expenses > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'analytics' && styles.tabActive]} onPress={() => setTab('analytics')} activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'analytics' && styles.tabTextActive]}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'budgets' && styles.tabActive]} onPress={() => setTab('budgets')} activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'budgets' && styles.tabTextActive]}>Budgets</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'analytics' ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>This Month</Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}><Text style={styles.heroVal}>${stats.sales.toLocaleString()}</Text><Text style={styles.heroMeta}>Revenue</Text></View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}><Text style={styles.heroVal}>${stats.expenses.toLocaleString()}</Text><Text style={styles.heroMeta}>Expenses</Text></View>
              </View>
            </View>
            {!hasRealData && (
              <View style={styles.placeholderBanner}>
                <Ionicons name="analytics-outline" size={32} color={t.colors.primary} />
                <Text style={styles.placeholderTitle}>Analytics Preview</Text>
                <Text style={styles.placeholderDesc}>Add transactions to see your real revenue and expense trends here.</Text>
              </View>
            )}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Revenue vs Expenses (7 Day)</Text>
              <LineChart data={{ labels: stats.dailyData.labels.slice(-7), datasets: [{ data: stats.dailyData.sales.slice(-7), color: () => t.colors.success }, { data: stats.dailyData.expenses.slice(-7), color: () => t.colors.danger }] }} width={screenWidth - 48} height={180} chartConfig={chartConfig} bezier />
            </View>
          </>
        ) : (
          <>
            <View style={styles.budgetHeaderRow}>
              <Text style={styles.budgetSectionTitle}>Monthly Budgets</Text>
              <TouchableOpacity style={styles.addBudgetBtn} onPress={() => setBudgetModal(true)} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color={t.colors.white} />
                <Text style={styles.addBudgetText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.healthCard}>
              <Text style={styles.healthLabel}>Budget Health</Text>
              <Text style={styles.healthValue}>${(budgets.reduce((s, b) => s + b.limit, 0) - budgets.reduce((s, b) => s + b.spent, 0)).toLocaleString()}</Text>
              <Text style={styles.healthMeta}>Remaining This Month</Text>
            </View>
            {budgets.filter(b => b.limit > 0).length === 0 && (
              <View style={styles.placeholderBanner}>
                <Ionicons name="wallet-outline" size={32} color={t.colors.secondary} />
                <Text style={styles.placeholderTitle}>No Budgets Set</Text>
                <Text style={styles.placeholderDesc}>Tap "Add" to set spending limits for your categories.</Text>
              </View>
            )}
            {budgets.map(b => {
              if (b.limit === 0) return null;
              const pct = Math.min(Math.round((b.spent / b.limit) * 100), 100);
              const over = b.spent > b.limit;
              return (
                <TouchableOpacity key={b.name} style={styles.budgetCard} onLongPress={() => handleDeleteBudget(b)} activeOpacity={0.8}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetName}>{b.name}</Text>
                    <Text style={[styles.budgetPct, { color: over ? t.colors.danger : t.colors.primary }]}>{pct}%</Text>
                  </View>
                  <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: over ? t.colors.danger : t.colors.primary }]} /></View>
                  <Text style={styles.budgetMeta}>${b.spent.toLocaleString()} of ${b.limit.toLocaleString()}</Text>
                  <TouchableOpacity style={styles.deleteChip} onPress={() => handleDeleteBudget(b)}>
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
                <TouchableOpacity key={c} style={[styles.chip, budgetForm.category_id === c && styles.chipActive]} onPress={() => setBudgetForm({...budgetForm, category_id: c})} activeOpacity={0.7}>
                  <Text style={[styles.chipText, budgetForm.category_id === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View></ScrollView>
          </View>
          <View style={styles.inputGroup}><Text style={styles.label}>Budget Amount</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={budgetForm.amount} onChangeText={t => setBudgetForm({...budgetForm, amount: t})} placeholder="0.00" placeholderTextColor={t.colors.medium} /></View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAddBudget} activeOpacity={0.8}><Text style={styles.saveText}>Set Budget</Text></TouchableOpacity>
        </View>
      </Modal>

      {toast.visible && (
        <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] }) }], opacity: toastAnim }]}>
          <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={20} color={t.colors.white} />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  tabRow: { flexDirection: 'row', margin: t.spacing.lg, marginBottom: 0, backgroundColor: t.colors.surface, borderRadius: t.radius.button, padding: 4, borderWidth: 1, borderColor: t.colors.border },
  tab: { flex: 1, paddingVertical: t.spacing.md, alignItems: 'center', borderRadius: t.radius.input },
  tabActive: { backgroundColor: t.colors.primary },
  tabText: { fontSize: 14, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.medium },
  tabTextActive: { color: t.colors.white },
  scroll: { padding: t.spacing.lg, paddingBottom: 100 },
  heroCard: { backgroundColor: t.colors.primary, borderRadius: t.radius.card, padding: t.spacing.xxl, marginBottom: t.spacing.lg, alignItems: 'center' },
  heroLabel: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.white, opacity: 0.8, marginBottom: t.spacing.lg },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xxl },
  heroStat: { alignItems: 'center' },
  heroVal: { fontSize: 22, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.white },
  heroMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.white, opacity: 0.7, marginTop: 4 },
  heroDivider: { width: 1, height: 40, backgroundColor: t.colors.white, opacity: 0.3 },
  placeholderBanner: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, alignItems: 'center', marginBottom: t.spacing.lg },
  placeholderTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginTop: t.spacing.md },
  placeholderDesc: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.medium, textAlign: 'center', marginTop: t.spacing.sm, lineHeight: 20 },
  chartCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, ...t.shadows.sm },
  chartTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginBottom: t.spacing.lg },
  budgetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  budgetSectionTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  addBudgetBtn: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, backgroundColor: t.colors.primary, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm, borderRadius: t.radius.button },
  addBudgetText: { color: t.colors.white, fontSize: 14, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  healthCard: { backgroundColor: t.colors.primary, borderRadius: t.radius.card, padding: t.spacing.xxl, marginBottom: t.spacing.lg, alignItems: 'center' },
  healthLabel: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.white, opacity: 0.8 },
  healthValue: { fontSize: 32, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.white, marginTop: t.spacing.sm },
  healthMeta: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.white, opacity: 0.7, marginTop: 4 },
  budgetCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
  budgetName: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  budgetPct: { fontSize: 14, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800' },
  progressBar: { height: 10, backgroundColor: t.colors.border, borderRadius: t.radius.pill, overflow: 'hidden', marginBottom: t.spacing.sm },
  progressFill: { height: '100%', borderRadius: t.radius.pill },
  budgetMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium },
  deleteChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', marginTop: t.spacing.sm, paddingHorizontal: t.spacing.sm, paddingVertical: 2 },
  deleteChipText: { fontSize: 11, fontFamily: 'Inter-Regular', color: t.colors.medium },
  modalContent: { marginTop: t.spacing.sm },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  chipRow: { flexDirection: 'row', gap: t.spacing.sm },
  chip: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { fontSize: 12, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium },
  chipTextActive: { color: t.colors.white },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginTop: t.spacing.sm },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  toast: { position: 'absolute', bottom: 100, left: t.spacing.xl, right: t.spacing.xl, backgroundColor: t.colors.dark, borderRadius: t.radius.button, padding: t.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, ...t.shadows.lg },
  toastText: { color: t.colors.white, fontSize: 14, fontFamily: 'Inter-Medium', fontWeight: '500', flex: 1 },
});

export default InsightsScreen;