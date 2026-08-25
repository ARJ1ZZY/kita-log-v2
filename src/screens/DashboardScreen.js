import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { t } from '../styles/designSystem';
import { useFormat } from '../utils/format';
import PressableScale from '../components/PressableScale';

const SkeletonPulse = ({ style, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, delay, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: false }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);
  return <Animated.View style={[styles.skeletonBlock, style, { opacity }]} />;
};

const DashboardScreen = ({ navigation }) => {
  const { user, activeBusinessId, openAddBusinessModal } = useAuth();
  const { formatCurrency, formatDate } = useFormat();
  const { isOffline, pendingOperations, syncNow, isSyncing } = useOffline();
  const [stats, setStats] = useState({ balance: 0, income: 0, expenses: 0, budgetSpent: 0, budgetLimit: 0, items: 0, lowStock: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (!user || !activeBusinessId) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const allTxQ = query(collection(db, 'transactions'), where('business_id', '==', activeBusinessId));
      const allSnap = await getDocs(allTxQ);
      let income = 0, expenses = 0, monthExpenses = 0;
      const allTx = [];
      allSnap.forEach(doc => {
        const d = doc.data();
        allTx.push({ id: doc.id, ...d });
        if (d.type === 'sale') income += d.amount;
        else { expenses += d.amount; if (d.date >= monthStart) monthExpenses += d.amount; }
      });
      const sorted = allTx.sort((a, b) => b.date?.localeCompare(a.date) || b.time?.localeCompare(a.time));
      setRecentTransactions(sorted.slice(0, 5));

      const invQ = query(collection(db, 'inventory'), where('business_id', '==', activeBusinessId));
      const invSnap = await getDocs(invQ);
      let lowStockCount = 0;
      invSnap.forEach(doc => { const d = doc.data(); if (d.current_stock <= d.low_stock_threshold) lowStockCount++; });

      const bQ = query(collection(db, 'budgets'), where('business_id', '==', activeBusinessId), where('month', '==', monthStr));
      const bSnap = await getDocs(bQ);
      let budgetLimit = 0;
      bSnap.forEach(doc => { budgetLimit += doc.data().amount; });

      setStats({ balance: income - expenses, income, expenses, budgetSpent: monthExpenses, budgetLimit, items: invSnap.size, lowStock: lowStockCount });
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } catch (e) {
      console.error(e);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [user, activeBusinessId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const budgetPercent = stats.budgetLimit > 0 ? Math.min(Math.round((stats.budgetSpent / stats.budgetLimit) * 100), 100) : 0;

  if (!activeBusinessId) {
    return (
      <View style={styles.noBusinessContainer}>
        <Ionicons name="business-outline" size={64} color={t.colors.medium} />
        <Text style={styles.noBusinessTitle}>No businesses yet</Text>
        <Text style={styles.noBusinessSub}>Add a business to start tracking</Text>
        <PressableScale onPress={openAddBusinessModal} style={styles.noBusinessBtn}>
          <Text style={styles.noBusinessBtnText}>Add Business</Text>
        </PressableScale>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SkeletonPulse style={styles.skeletonHero} />
          <View style={styles.statsGrid}>
            <SkeletonPulse style={styles.skeletonStatCard} />
            <SkeletonPulse style={styles.skeletonStatCard} delay={200} />
          </View>
          <View style={styles.statsGrid}>
            <SkeletonPulse style={styles.skeletonStatCard} delay={400} />
            <SkeletonPulse style={styles.skeletonStatCard} delay={600} />
          </View>
          <SkeletonPulse style={styles.skeletonSectionHeader} />
          {[...Array(3)].map((_, i) => (
            <SkeletonPulse key={i} style={styles.skeletonTxRow} delay={i * 150} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Offline Banner */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={18} color={t.colors.white} />
              <Text style={styles.offlineText}>Offline Mode</Text>
              {pendingOperations > 0 && (
                <Text style={styles.offlinePending}>{pendingOperations} pending</Text>
              )}
              {isSyncing && <ActivityIndicator size="small" color={t.colors.white} style={{ marginLeft: 8 }} />}
              {!isSyncing && pendingOperations > 0 && (
                <TouchableOpacity onPress={syncNow} style={styles.syncBtn}>
                  <Text style={styles.syncBtnText}>Sync</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>Total Net Balance</Text>
            <Text style={styles.heroValue}>{formatCurrency(stats.balance)}</Text>
            <View style={styles.metricRow}>
              <View style={[styles.metricChip, { backgroundColor: t.colors.successLight }]}>
                <Ionicons name="arrow-up" size={14} color={t.colors.success} />
                <Text style={[styles.metricText, { color: t.colors.success }]}>+{formatCurrency(stats.income)}</Text>
              </View>
              <View style={[styles.metricChip, { backgroundColor: t.colors.dangerLight }]}>
                <Ionicons name="arrow-down" size={14} color={t.colors.danger} />
                <Text style={[styles.metricText, { color: t.colors.danger }]}>-{formatCurrency(stats.expenses)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.successLight }]}><Ionicons name="trending-up" size={20} color={t.colors.success} /></View>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.income)}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.dangerLight }]}><Ionicons name="trending-down" size={20} color={t.colors.danger} /></View>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.expenses)}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.primaryLight }]}><Ionicons name="cube-outline" size={20} color={t.colors.primary} /></View>
              <Text style={styles.statLabel}>Stock</Text>
              <Text style={styles.statValue}>{stats.items}</Text>
              {stats.lowStock > 0 && <Text style={styles.statSub}>{stats.lowStock} low</Text>}
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: t.colors.secondaryLight }]}><Ionicons name="wallet-outline" size={20} color={t.colors.secondary} /></View>
              <Text style={styles.statLabel}>Budget</Text>
              <Text style={styles.statValue}>{budgetPercent}%</Text>
              <Text style={styles.statSub}>{formatCurrency(stats.budgetSpent)} / {formatCurrency(stats.budgetLimit)}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <PressableScale onPress={() => navigation?.navigate?.('Transactions')}>
              <Text style={styles.viewAll}>View All</Text>
            </PressableScale>
          </View>
          {recentTransactions.length > 0 ? (
            recentTransactions.map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'sale' ? t.colors.successLight : t.colors.dangerLight }]}>
                  <Ionicons name={tx.type === 'sale' ? 'arrow-up-circle' : 'arrow-down-circle'} size={18} color={tx.type === 'sale' ? t.colors.success : t.colors.danger} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName} numberOfLines={1}>{tx.description}</Text>
                  <Text style={styles.txMeta}>{formatDate(tx.date)} • {tx.time}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'sale' ? t.colors.success : t.colors.danger }]}>{tx.type === 'sale' ? '+' : '-'}{formatCurrency(tx.amount)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={t.colors.medium} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  scroll: { padding: t.spacing.lg, paddingBottom: 30 },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.warning,
    borderRadius: t.radius.card,
    padding: t.spacing.md,
    marginBottom: t.spacing.md,
    gap: t.spacing.sm,
  },
  offlineText: {
    fontSize: 13,
    fontFamily: t.typography.bodySemiBold,
    color: t.colors.white,
  },
  offlinePending: {
    fontSize: 12,
    fontFamily: t.typography.body,
    color: t.colors.white,
    opacity: 0.8,
    marginLeft: 4,
  },
  syncBtn: {
    backgroundColor: t.colors.white,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 4,
    borderRadius: t.radius.pill,
    marginLeft: 'auto',
  },
  syncBtnText: {
    fontSize: 12,
    fontFamily: t.typography.bodySemiBold,
    color: t.colors.warning,
  },
  heroCard: { backgroundColor: t.colors.surface, borderRadius: 24, borderWidth: 1, borderColor: t.colors.border, padding: 24, marginBottom: t.spacing.lg, ...t.shadows.xl },
  heroLabel: { fontSize: 13, fontFamily: t.typography.bodyMedium, fontWeight: '500', color: t.colors.medium, marginBottom: 8 },
  heroValue: { fontSize: 36, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  metricRow: { flexDirection: 'row', gap: t.spacing.md, marginTop: t.spacing.lg },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: t.radius.pill },
  metricText: { fontSize: 13, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: t.spacing.md, marginBottom: t.spacing.lg },
  statCard: { flex: 1, backgroundColor: t.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, ...t.shadows.md },
  statIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: t.spacing.md },
  statLabel: { fontSize: 12, fontFamily: t.typography.bodyMedium, fontWeight: '500', color: t.colors.medium, marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  statSub: { fontSize: 11, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg, marginTop: t.spacing.xl },
  sectionTitle: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  viewAll: { fontSize: 14, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.primary },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.sm, ...t.shadows.sm },
  txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.md },
  txInfo: { flex: 1 },
  txName: { fontSize: 15, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  txMeta: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  txAmount: { fontSize: 15, fontFamily: t.typography.heading, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 12 },
  emptySub: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 4 },
  noBusinessContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: t.colors.background },
  noBusinessTitle: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginTop: 16 },
  noBusinessSub: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 4 },
  noBusinessBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, paddingHorizontal: 24, marginTop: 20 },
  noBusinessBtnText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  skeletonBlock: { backgroundColor: t.colors.border, borderRadius: 8 },
  skeletonHero: { height: 160, borderRadius: 24, marginBottom: t.spacing.lg },
  skeletonStatCard: { flex: 1, height: 110, borderRadius: 20 },
  skeletonSectionHeader: { height: 24, width: '40%', marginTop: t.spacing.xl, marginBottom: t.spacing.lg },
  skeletonTxRow: { height: 70, borderRadius: 16, marginBottom: t.spacing.sm },
});

export default DashboardScreen;