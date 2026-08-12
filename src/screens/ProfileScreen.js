import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const ProfileScreen = ({ onClose, onPersonalPress, onSecurityPress, onPreferencesPress, onReportsPress, onBackupPress }) => {
  const { user, logout } = useAuth();
  const [quickStats, setQuickStats] = useState({ items: 0, transactions: 0, lowStock: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const invQ = query(collection(db, 'inventory'), where('user_id', '==', user.uid));
      const invSnap = await getDocs(invQ);
      let low = 0; invSnap.forEach(d => { if (d.data().current_stock <= d.data().low_stock_threshold) low++; });
      const txQ = query(collection(db, 'transactions'), where('user_id', '==', user.uid));
      const txSnap = await getDocs(txQ);
      setQuickStats({ items: invSnap.size, transactions: txSnap.size, lowStock: low });
    };
    fetch();
  }, [user]);

  const menuItems = [
    { icon: 'person-outline', label: 'Personal Info', color: t.colors.primary, action: onPersonalPress },
    { icon: 'shield-checkmark-outline', label: 'Security', color: t.colors.success, action: onSecurityPress },
    { icon: 'options-outline', label: 'Preferences', color: t.colors.medium, action: onPreferencesPress },
    { icon: 'bar-chart-outline', label: 'Reports', color: t.colors.primary, action: onReportsPress },
    { icon: 'cloud-upload-outline', label: 'Backup & Restore', color: t.colors.secondary, action: onBackupPress },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}><Ionicons name="person" size={36} color={t.colors.white} /></View>
          <Text style={styles.userName}>{user?.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {user?.company_name ? <Text style={styles.userCompany}>{user.company_name}</Text> : null}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={22} color={t.colors.primary} />
            <Text style={styles.statValue}>{quickStats.items}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={22} color={t.colors.success} />
            <Text style={styles.statValue}>{quickStats.transactions}</Text>
            <Text style={styles.statLabel}>Transacts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning-outline" size={22} color={quickStats.lowStock > 0 ? t.colors.warning : t.colors.medium} />
            <Text style={styles.statValue}>{quickStats.lowStock}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuRow, index < menuItems.length - 1 && styles.menuBorder]}
              onPress={item.action}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '12' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.medium} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={t.colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.version}>KITA-LOG v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  list: { padding: t.spacing.lg, paddingBottom: 40 },
  userCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, alignItems: 'center', marginBottom: t.spacing.lg, ...t.shadows.sm },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: t.spacing.lg },
  userName: { fontSize: 22, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  userEmail: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 4 },
  userCompany: { fontSize: 13, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.primary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: t.spacing.md, marginBottom: t.spacing.lg },
  statCard: { flex: 1, backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, alignItems: 'center', ...t.shadows.sm },
  statValue: { fontSize: 20, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginTop: t.spacing.sm },
  statLabel: { fontSize: 11, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium, marginTop: 2 },
  menuCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, marginBottom: t.spacing.lg, ...t.shadows.sm },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: t.spacing.lg, gap: t.spacing.lg },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.dark },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.md, backgroundColor: t.colors.surface, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.border, paddingVertical: t.spacing.lg },
  logoutText: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.danger },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: t.spacing.xl },
});

export default ProfileScreen;