import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, Spacing, BorderRadius } from '../styles/colors';
import { t } from '../styles/designSystem';  // or the correct relative path

const StatCard = ({ title, value, subtitle, color = theme.primary, icon, iconBg }) => (
  <View style={styles.card}>
    <View style={styles.topRow}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg || theme.iconBackground }]}>
        <Ionicons name={icon || 'stats-chart-outline'} size={20} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
    <Text style={[styles.value, { color }]}>{value}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: theme.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '900',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontWeight: '500',
    color: theme.secondaryText,
  },
});

export default StatCard;