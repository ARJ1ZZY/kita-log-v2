import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ balance: 0, income: 0, expenses: 0, budgetSpent: 0, budgetLimit: 0, items: 0, lowStock: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const allTxQ = query(collection(db, 'transactions'), where('user_id', '==', user.uid));
      const snap = await getDocs(allTxQ);
      let income = 0, expenses = 0, monthExpenses = 0;
      snap.forEach(doc => {
        const d = doc.data();
        if (d.type === 'sale') { income += d.amount; }
        else { expenses += d.amount; if (d.date >= monthStart) monthExpenses += d.amount; }
      });
      const invQ = query(collection(db, 'inventory'), where('user_id', '==', user.uid));
      const invSnap = await getDocs(invQ);
      let lowStockCount = 0;
      invSnap.forEach(doc => { const d = doc.data(); if (d.current_stock <= d.low_stock_threshold) lowStockCount++; });
      
      const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const bQ = query(collection(db, 'budgets'), where('user_id', '==', user.uid), where('month', '==', monthStr));
      const bSnap = await getDocs(bQ);
      let budgetLimit = 0; bSnap.forEach(doc => { budgetLimit += doc.data().amount; });
      
      setStats({ balance: income - expenses, income, expenses, budgetSpent: monthExpenses, budgetLimit, items: invSnap.size, lowStock: lowStockCount });
      setHasData(snap.size > 0 || invSnap.size > 0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }, [user]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const budgetPercent = stats.budgetLimit > 0 ? Math.min(Math.round((stats.budgetSpent / stats.budgetLimit) * 100), 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchStats} />} showsVerticalScrollIndicator={false}>
        {!hasData && (
          <View style={styles.welcomeBanner}>
            <Ionicons name="sparkles-outline" size={40} color={t.colors.primary} />
            <Text style={styles.welcomeTitle}>Welcome to KITA-LOG!</Text>
            <Text style={styles.welcomeDesc}>Tap the + button below to add your first transaction or stock item.</Text>
          </View>
        )}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Net Balance</Text>
            <Text style={styles.heroValue}>${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            <View style={styles.metricRow}>
              <View style={[styles.metricChip, { backgroundColor: t.colors.successLight }]}>
                <Ionicons name="arrow-up" size={14} color={t.colors.success} />
                <Text style={[styles.metricText, { color: t.colors.success }]}>+${stats.income.toLocaleString()}</Text>
              </View>
              <View style={[styles.metricChip, { backgroundColor: t.colors.dangerLight }]}>
                <Ionicons name="arrow-down" size={14} color={t.colors.danger} />
                <Text style={[styles.metricText, { color: t.colors.danger }]}>-${stats.expenses.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.successLight }]}><Ionicons name="trending-up" size={20} color={t.colors.success} /></View>
              <Text style={styles.statLabel}>Total Income</Text>
              <Text style={styles.statValue}>${stats.income.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.dangerLight }]}><Ionicons name="trending-down" size={20} color={t.colors.danger} /></View>
              <Text style={styles.statLabel}>Total Expenses</Text>
              <Text style={styles.statValue}>${stats.expenses.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.primaryLight }]}><Ionicons name="cube-outline" size={20} color={t.colors.primary} /></View>
              <Text style={styles.statLabel}>Stock Items</Text>
              <Text style={styles.statValue}>{stats.items}</Text>
              {stats.lowStock > 0 && <Text style={styles.statSub}>{stats.lowStock} low stock</Text>}
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.secondary + '15' }]}><Ionicons name="wallet-outline" size={20} color={t.colors.secondary} /></View>
              <Text style={styles.statLabel}>Monthly Budget</Text>
              <Text style={styles.statValue}>{budgetPercent}%</Text>
              <Text style={styles.statSub}>${stats.budgetSpent.toLocaleString()} / ${stats.budgetLimit.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('Transactions')} activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={t.colors.medium} />
            <Text style={styles.emptyText}>{hasData ? 'Pull down to refresh' : 'No transactions yet'}</Text>
            <Text style={styles.emptySub}>Tap + to add your first transaction</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  scroll: { padding: t.spacing.lg, paddingBottom: 30 },
  welcomeBanner: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, alignItems: 'center', marginBottom: t.spacing.lg, ...t.shadows.sm },
  welcomeTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginTop: t.spacing.lg },
  welcomeDesc: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, textAlign: 'center', marginTop: t.spacing.sm, lineHeight: 20 },
  heroCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, marginBottom: t.spacing.lg, ...t.shadows.md },
  heroLabel: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium, marginBottom: t.spacing.sm },
  heroValue: { fontSize: 32, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  metricRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs, borderRadius: t.radius.pill },
  metricText: { fontSize: 13, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: t.spacing.md, marginBottom: t.spacing.lg },
  statCard: { flex: 1, backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, ...t.shadows.sm },
  statIcon: { width: 40, height: 40, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center', marginBottom: t.spacing.md },
  statLabel: { fontSize: 12, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium, marginBottom: t.spacing.xs },
  statValue: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  statSub: { fontSize: 11, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  sectionTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  viewAll: { fontSize: 14, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: t.spacing.xxxl },
  emptyText: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: t.spacing.md },
  emptySub: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 4 },
});

export default DashboardScreen;