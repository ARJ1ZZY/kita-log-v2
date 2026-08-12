import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const ALERTS = [
  { id: '1', icon: 'alert-circle-outline', color: t.colors.danger, title: 'Budget limit reached', desc: 'Marketing budget exceeded by $200', time: '2 hours ago' },
  { id: '2', icon: 'cash-outline', color: t.colors.success, title: 'New payment received', desc: '$1,200 from client invoice #4582', time: '5 hours ago' },
  { id: '3', icon: 'document-text-outline', color: t.colors.primary, title: 'Weekly report available', desc: 'Your financial summary for Oct 23-29 is ready', time: 'Yesterday' },
  { id: '4', icon: 'shield-checkmark-outline', color: t.colors.secondary, title: 'Security update', desc: 'Two-factor authentication recommended', time: '2 days ago' },
];

const NotificationsScreen = ({ onClose }) => (
  <View style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
        <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
      </TouchableOpacity>
      <Text style={styles.title}>Notifications</Text>
      <TouchableOpacity activeOpacity={0.7}><Text style={styles.markRead}>Mark all read</Text></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={styles.list}>
      {ALERTS.map(alert => (
        <View key={alert.id} style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: alert.color + '12' }]}><Ionicons name={alert.icon} size={22} color={alert.color} /></View>
          <View style={styles.info}><Text style={styles.cardTitle}>{alert.title}</Text><Text style={styles.cardDesc}>{alert.desc}</Text><Text style={styles.cardTime}>{alert.time}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={t.colors.medium} />
        </View>
      ))}
      <View style={styles.promoCard}>
        <Ionicons name="sparkles-outline" size={20} color={t.colors.white} />
        <Text style={styles.promoTitle}>Smart Budgets</Text>
        <Text style={styles.promoDesc}>AI-powered budget savings are now available.</Text>
        <TouchableOpacity style={styles.promoBtn} activeOpacity={0.8}><Text style={styles.promoBtnText}>Try Now</Text></TouchableOpacity>
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  markRead: { fontSize: 13, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.primary },
  list: { padding: t.spacing.lg, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  iconBox: { width: 44, height: 44, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.lg },
  info: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  cardDesc: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  cardTime: { fontSize: 11, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 4 },
  promoCard: { backgroundColor: t.colors.primary, borderRadius: t.radius.card, padding: t.spacing.xxl, marginTop: t.spacing.lg, alignItems: 'center' },
  promoTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.white, marginTop: t.spacing.md },
  promoDesc: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.white, opacity: 0.8, textAlign: 'center', marginTop: t.spacing.sm, marginBottom: t.spacing.lg },
  promoBtn: { backgroundColor: t.colors.white, paddingHorizontal: t.spacing.xxl, paddingVertical: t.spacing.md, borderRadius: t.radius.pill },
  promoBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.primary },
});

export default NotificationsScreen;