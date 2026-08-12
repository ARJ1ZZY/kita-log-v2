import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../styles/designSystem';
import AddTransactionModal from './AddTransactionModal';

const tabs = [
  { key: 'Dashboard', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { key: 'Transactions', icon: 'list-outline', activeIcon: 'list', label: 'Transact' },
  { key: 'FAB', isFab: true },
  { key: 'Stock', icon: 'cube-outline', activeIcon: 'cube', label: 'Stocks' },
  { key: 'Insights', icon: 'stats-chart-outline', activeIcon: 'stats-chart', label: 'Insights' },
];

const BottomNav = ({ activeTab, onTabPress, navigation }) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={[styles.container, { paddingBottom: insets.bottom + t.spacing.sm }]}>
        {tabs.map((tab) => {
          if (tab.isFab) {
            return (
              <TouchableOpacity key="fab" style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color={t.colors.white} />
              </TouchableOpacity>
            );
          }
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.tab} onPress={() => onTabPress(tab.key)} activeOpacity={0.6}>
              <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? t.colors.primary : t.colors.medium} />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} navigation={navigation} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.border,
    paddingTop: t.spacing.sm, ...t.shadows.lg,
  },
  tab: { alignItems: 'center', flex: 1, paddingVertical: t.spacing.xs },
  label: { fontSize: 10, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.medium, marginTop: 2 },
  labelActive: { color: t.colors.primary },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: t.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: -28,
    borderWidth: 3, borderColor: t.colors.surface, ...t.shadows.lg,
  },
});

export default BottomNav;