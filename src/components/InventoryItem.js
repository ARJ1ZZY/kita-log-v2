import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, Colors, Spacing, BorderRadius } from '../styles/colors';

const getStockStatus = (current, threshold) => {
  if (current <= 0) return { label: 'Out of Stock', color: Colors.light.danger, bg: Colors.light.dangerLight, icon: 'close-circle' };
  if (current <= threshold) return { label: 'Low Stock', color: Colors.light.warning, bg: Colors.light.warningLight, icon: 'alert-circle' };
  return { label: 'In Stock', color: Colors.light.success, bg: Colors.light.successLight, icon: 'checkmark-circle' };
};

const InventoryItem = ({ item, onEdit, onDelete }) => {
  const status = getStockStatus(item.current_stock, item.low_stock_threshold);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={24} color={status.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.item_name}</Text>
          <Text style={styles.category}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.stock}>Stock: {item.current_stock} {item.unit}</Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.cardBackground,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: theme.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 80,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    fontWeight: '500',
    color: theme.secondaryText,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  stock: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 4,
  },
  badge: {
    borderRadius: BorderRadius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default InventoryItem;