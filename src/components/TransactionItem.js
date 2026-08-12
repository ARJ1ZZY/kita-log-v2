import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, Colors, Spacing, BorderRadius } from '../styles/colors';

const TransactionItem = ({ transaction, onEdit, onDelete }) => (
  <View style={styles.container}>
    <View style={styles.leftSection}>
      <View style={[styles.badge, { backgroundColor: transaction.type === 'sale' ? Colors.light.successLight : Colors.light.dangerLight }]}>
        <Ionicons
          name={transaction.type === 'sale' ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={20}
          color={transaction.type === 'sale' ? Colors.light.success : Colors.light.danger}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>{transaction.description}</Text>
        <Text style={styles.date}>{transaction.date} • {transaction.time}</Text>
      </View>
    </View>
    <View style={styles.rightSection}>
      <Text style={[styles.amount, { color: transaction.type === 'sale' ? Colors.light.success : Colors.light.danger }]}>
        {transaction.type === 'sale' ? '+' : '-'} ₱{transaction.amount.toLocaleString()}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onEdit(transaction)} style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={16} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(transaction.id)} style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

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
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.md },
  badge: {
    width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  info: { flex: 1 },
  description: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: theme.primaryText, marginBottom: 2 },
  date: { fontSize: 12, fontFamily: 'Inter-Regular', fontWeight: '500', color: theme.secondaryText },
  rightSection: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', marginBottom: 4 },
  actions: { flexDirection: 'row', gap: Spacing.xs },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.background,
    justifyContent: 'center', alignItems: 'center',
  },
});

export default TransactionItem;