import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const CATEGORIES = [
  { name: 'Marketing', icon: 'megaphone-outline', limit: 2000 },
  { name: 'Rent & Utilities', icon: 'home-outline', limit: 3000 },
  { name: 'Supplies', icon: 'cube-outline', limit: 1000 },
  { name: 'Travel', icon: 'airplane-outline', limit: 1500 },
  { name: 'Subscriptions', icon: 'card-outline', limit: 500 },
];

const BudgetsScreen = () => {
  const { user } = useAuth();
  const [spending, setSpending] = useState({});
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const allTxQ = query(collection(db, 'transactions'), where('user_id', '==', user.uid), where('type', '==', 'expense'));
    const snap = await getDocs(allTxQ);
    const map = {};
    snap.forEach(doc => {
      const d = doc.data();
      if (d.date >= `${monthStr}-01` && d.date <= `${monthStr}-31`) {
        map[d.category_id || 'Other'] = (map[d.category_id || 'Other'] || 0) + d.amount;
      }
    });
    setSpending(map);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const totalSpent = Object.values(spending).reduce((a, b) => a + b, 0);
  const totalLimit = CATEGORIES.reduce((a, c) => a + c.limit, 0);
  const overallPercent = Math.min(Math.round((totalSpent / totalLimit) * 100), 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      {loading ? <ActivityIndicator size="large" color={t.colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={CATEGORIES}
          keyExtractor={item => item.name}
          ListHeaderComponent={
            <>
              <View style={styles.healthCard}>
                <Text style={styles.healthLabel}>Budget Health</Text>
                <Text style={styles.healthValue}>${(totalLimit - totalSpent).toLocaleString()}</Text>
                <Text style={styles.healthMeta}>Total Remaining</Text>
                <View style={styles.healthBadge}>
                  <Text style={styles.healthBadgeText}>Overall Usage {overallPercent}%</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
            </>
          }
          renderItem={({ item }) => {
            const spent = spending[item.name] || 0;
            const percent = Math.min(Math.round((spent / item.limit) * 100), 100);
            const isOver = spent > item.limit;
            return (
              <View style={styles.catCard}>
                <View style={styles.catHeader}>
                  <View style={styles.catInfo}>
                    <View style={[styles.catIcon, { backgroundColor: isOver ? t.colors.dangerLight : t.colors.primaryLight }]}>
                      <Ionicons name={item.icon} size={18} color={isOver ? t.colors.danger : t.colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.catName}>{item.name}</Text>
                      <Text style={styles.catMeta}>${(item.limit - spent).toLocaleString()} remaining</Text>
                    </View>
                  </View>
                  {isOver && <View style={styles.alertBadge}><Text style={styles.alertText}>Over</Text></View>}
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: isOver ? t.colors.danger : t.colors.primary }]} />
                </View>
                <Text style={styles.progressLabel}>${spent.toLocaleString()} of ${item.limit.toLocaleString()}</Text>
              </View>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  list: { padding: t.spacing.lg, paddingBottom: 30 },
  healthCard: { backgroundColor: t.colors.primary, borderRadius: t.radius.card, padding: t.spacing.xxl, marginBottom: t.spacing.xxl, alignItems: 'center' },
  healthLabel: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.white, opacity: 0.8 },
  healthValue: { fontSize: 32, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.white, marginTop: t.spacing.sm },
  healthMeta: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.white, opacity: 0.7, marginBottom: t.spacing.lg },
  healthBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.xs, borderRadius: t.radius.pill },
  healthBadgeText: { fontSize: 13, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.white },
  sectionTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginBottom: t.spacing.lg },
  catCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.md },
  catInfo: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  catIcon: { width: 40, height: 40, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  catMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  alertBadge: { backgroundColor: t.colors.dangerLight, paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs, borderRadius: t.radius.pill },
  alertText: { fontSize: 11, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.danger, textTransform: 'uppercase' },
  progressBar: { height: 10, backgroundColor: t.colors.border, borderRadius: t.radius.pill, overflow: 'hidden', marginBottom: t.spacing.sm },
  progressFill: { height: '100%', borderRadius: t.radius.pill },
  progressLabel: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium },
});

export default BudgetsScreen;