import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';
import FadeInView from '../components/FadeInView';

const NotificationsScreen = ({ onClose }) => {
  const alerts = [
    { id: '1', icon: 'alert-circle-outline', color: t.colors.danger, title: 'Budget limit reached', desc: 'Marketing budget exceeded', time: '2h ago' },
    { id: '2', icon: 'cash-outline', color: t.colors.success, title: 'Payment received', desc: '$1,200 from invoice', time: '5h ago' },
    { id: '3', icon: 'document-text-outline', color: t.colors.primary, title: 'Report available', desc: 'Weekly summary ready', time: 'Yesterday' },
  ];

  return (
    <FadeInView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={t.colors.dark} /></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity><Text style={styles.markRead}>Mark all</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {alerts.map(alert => (
          <View key={alert.id} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: alert.color + '12' }]}><Ionicons name={alert.icon} size={22} color={alert.color} /></View>
            <View style={styles.info}><Text style={styles.cardTitle}>{alert.title}</Text><Text style={styles.cardDesc}>{alert.desc}</Text><Text style={styles.cardTime}>{alert.time}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={t.colors.medium} />
          </View>
        ))}
      </ScrollView>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  markRead: { fontSize: 13, fontFamily: t.typography.bodySemiBold, color: t.colors.primary },
  list: { padding: t.spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.lg },
  info: { flex: 1 },
  cardTitle: { fontSize: 15, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  cardDesc: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  cardTime: { fontSize: 11, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 4 },
});

export default NotificationsScreen;