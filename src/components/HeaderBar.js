import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, StatusBar, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { getSingleDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const HeaderBar = ({ onProfilePress, onBusinessPress }) => {
  const insets = useSafeAreaInsets();
  const { user, activeBusinessId } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const [alertDropdown, setAlertDropdown] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [avatarColor, setAvatarColor] = useState('#2563EB');
  const [businessName, setBusinessName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!user || !activeBusinessId) return;

    // Fetch avatar color
    getSingleDocument('user_settings', user.uid)
      .then(settings => {
        if (settings?.avatar_color) setAvatarColor(settings.avatar_color);
      })
      .catch(() => {});

    // Fetch business name
    getSingleDocument('businesses', activeBusinessId)
      .then(biz => {
        if (biz?.business_name) setBusinessName(biz.business_name);
      })
      .catch(() => {});

    // Fetch low stock alerts for active business
    const fetchAlerts = async () => {
      try {
        const invQ = query(
          collection(db, 'inventory'),
          where('business_id', '==', activeBusinessId)
        );
        const invSnap = await getDocs(invQ);
        const lowStockItems = [];
        invSnap.forEach(doc => {
          const d = doc.data();
          if (d.current_stock <= d.low_stock_threshold) {
            lowStockItems.push({
              id: doc.id,
              message: `${d.item_name}: ${d.current_stock} ${d.unit}`,
              icon: 'cube-outline',
              color: t.colors.warning,
            });
          }
        });
        setAlerts(lowStockItems);
        setAlertCount(lowStockItems.length);
      } catch (e) { console.error(e); }
    };
    fetchAlerts();
  }, [user, activeBusinessId]);

  useEffect(() => {
    if (alertDropdown) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(-20);
    }
  }, [alertDropdown]);

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={onProfilePress} style={styles.avatarBtn} activeOpacity={0.6}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Ionicons name="person" size={18} color={t.colors.white} />
          </View>
        </TouchableOpacity>
        <View style={styles.brand}>
          <View style={styles.logoRow}>
            <Text style={styles.kita}>KITA</Text>
            <Text style={styles.log}>-LOG</Text>
          </View>
          {businessName ? <Text style={styles.businessName}>{businessName}</Text> : null}
        </View>
        <View style={styles.rightIcons}>
          <TouchableOpacity onPress={onBusinessPress} style={styles.iconBtn} activeOpacity={0.6}>
            <Ionicons name="briefcase-outline" size={22} color={t.colors.dark} />
          </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setAlertDropdown(false)}>
                <Ionicons name="close" size={20} color={t.colors.medium} />
              </TouchableOpacity>
            </View>
            {alerts.length === 0 ? (
              <View style={styles.emptyAlerts}>
                <Ionicons name="checkmark-done-circle-outline" size={48} color={t.colors.success} />
                <Text style={styles.emptyAlertsText}>All clear!</Text>
              </View>
            ) : (
              <FlatList
                data={alerts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.alertItem}>
                    <View style={[styles.alertIconBox, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>
                    <Text style={styles.alertText}>{item.message}</Text>
                  </View>
                )}
                style={{ maxHeight: 300 }}
              />
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  avatarBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  brand: { flexDirection: 'column', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  kita: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary },
  log: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.secondary },
  businessName: { fontSize: 11, fontFamily: t.typography.bodyMedium, color: t.colors.medium, marginTop: 2 },
  rightIcons: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  alertDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.danger },
  dropdownOverlay: { flex: 1, justifyContent: 'flex-start', paddingTop: 110, paddingHorizontal: t.spacing.lg },
  dropdownContainer: { backgroundColor: t.colors.surface, borderRadius: t.radius.modal, padding: t.spacing.lg, ...t.shadows.lg },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  dropdownTitle: { fontSize: 17, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  emptyAlerts: { alignItems: 'center', paddingVertical: t.spacing.xxxl },
  emptyAlertsText: { fontSize: 15, color: t.colors.medium, marginTop: t.spacing.md, fontFamily: t.typography.body },
  alertItem: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  alertIconBox: { width: 36, height: 36, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center' },
  alertText: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.dark, flex: 1, lineHeight: 20 },
});

export default HeaderBar;