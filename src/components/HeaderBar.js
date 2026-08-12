import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, StatusBar, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const VISIBLE_HEIGHT = 56;

const HeaderBar = ({ onProfilePress }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [alertDropdown, setAlertDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      try {
        const invQ = query(collection(db, 'inventory'), where('user_id', '==', user.uid));
        const invSnap = await getDocs(invQ);
        const lowStockItems = [];
        invSnap.forEach(doc => {
          const d = doc.data();
          if (d.current_stock <= d.low_stock_threshold) {
            lowStockItems.push({ id: doc.id, type: 'low_stock', message: `${d.item_name}: ${d.current_stock} ${d.unit}`, icon: 'cube-outline', color: t.colors.warning });
          }
        });
        const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const bQ = query(collection(db, 'budgets'), where('user_id', '==', user.uid), where('month', '==', monthStr));
        const bSnap = await getDocs(bQ);
        const txQ = query(collection(db, 'transactions'), where('user_id', '==', user.uid), where('type', '==', 'expense'));
        const txSnap = await getDocs(txQ);
        const spentMap = {};
        txSnap.forEach(doc => { const d = doc.data(); if (d.date >= `${monthStr}-01`) spentMap[d.category_id || 'Other'] = (spentMap[d.category_id || 'Other'] || 0) + d.amount; });
        const budgetAlerts = [];
        bSnap.forEach(doc => {
          const d = doc.data();
          const spent = spentMap[d.category_id] || 0;
          if (spent >= d.amount && d.amount > 0) {
            budgetAlerts.push({ id: doc.id, type: 'budget_over', message: `${d.category_id} budget exceeded`, icon: 'alert-circle-outline', color: t.colors.danger });
          } else if (spent >= d.amount * 0.75 && d.amount > 0) {
            budgetAlerts.push({ id: doc.id, type: 'budget_warn', message: `${d.category_id}: ${Math.round((spent/d.amount)*100)}% used`, icon: 'warning-outline', color: t.colors.warning });
          }
        });
        setAlerts([...lowStockItems, ...budgetAlerts]);
        setAlertCount(lowStockItems.length + budgetAlerts.length);
      } catch (e) { console.error(e); }
    };
    fetchAlerts();
  }, [user]);

  useEffect(() => {
    if (alertDropdown) {
      Animated.parallel([Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true })]).start();
    } else { fadeAnim.setValue(0); slideAnim.setValue(-20); }
  }, [alertDropdown]);

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top, height: insets.top + VISIBLE_HEIGHT }]}>
        <View style={styles.inner}>
          <TouchableOpacity onPress={onProfilePress} style={styles.avatarBtn} activeOpacity={0.6}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color={t.colors.white} />
            </View>
          </TouchableOpacity>
          <View style={styles.brand}>
            <Text style={styles.kita}>KITA</Text>
            <Text style={styles.log}>-LOG</Text>
          </View>
          <TouchableOpacity onPress={() => setAlertDropdown(!alertDropdown)} style={styles.iconBtn} activeOpacity={0.6}>
            <Ionicons name={alertCount > 0 ? "notifications" : "notifications-outline"} size={22} color={t.colors.dark} />
            {alertCount > 0 && <View style={styles.alertDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={alertDropdown} transparent animationType="none" onRequestClose={() => setAlertDropdown(false)}>
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setAlertDropdown(false)}>
          <Animated.View style={[styles.dropdownContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setAlertDropdown(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={20} color={t.colors.medium} />
              </TouchableOpacity>
            </View>
            {alerts.length === 0 ? (
              <View style={styles.emptyAlerts}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={t.colors.success} />
                <Text style={styles.emptyAlertsText}>All clear!</Text>
              </View>
            ) : (
              <FlatList data={alerts} keyExtractor={item => item.id} renderItem={({ item }) => (
                <View style={styles.alertItem}>
                  <View style={[styles.alertIconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.alertText}>{item.message}</Text>
                </View>
              )} style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: t.colors.surface, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.spacing.lg },
  avatarBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'baseline' },
  kita: { fontSize: 20, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.primary },
  log: { fontSize: 20, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.secondary },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  alertDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.danger },
  dropdownOverlay: { flex: 1, justifyContent: 'flex-start', paddingTop: 110, paddingHorizontal: t.spacing.lg },
  dropdownContainer: { backgroundColor: t.colors.surface, borderRadius: t.radius.modal, padding: t.spacing.lg, ...t.shadows.lg },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  dropdownTitle: { fontSize: 17, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  emptyAlerts: { alignItems: 'center', paddingVertical: t.spacing.xxxl },
  emptyAlertsText: { fontSize: 15, color: t.colors.medium, marginTop: t.spacing.md, fontFamily: 'Inter-Regular' },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  alertIconBox: { width: 36, height: 36, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center' },
  alertText: { fontSize: 14, fontFamily: 'Inter-Regular', fontWeight: '400', color: t.colors.dark, flex: 1, lineHeight: 20 },
});

export default HeaderBar;