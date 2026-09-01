import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getSingleDocument, setDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const SettingsScreen = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [currency, setCurrency] = useState('$');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const data = await getSingleDocument('user_settings', user.uid);
      if (data) { setCurrency(data.currency_symbol || '$'); setDateFormat(data.date_format || 'MM/DD/YYYY'); }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await setDocument('user_settings', user.uid, { currency_symbol: currency, date_format: dateFormat });
    Alert.alert('Saved', 'Settings updated.');
    setSaving(false);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={t.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency Symbol</Text>
            <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="$" placeholderTextColor={t.colors.medium} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date Format</Text>
            <TextInput style={styles.input} value={dateFormat} onChangeText={setDateFormat} placeholder="MM/DD/YYYY" placeholderTextColor={t.colors.medium} />
          </View>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Save Settings</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={t.colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  list: { padding: t.spacing.lg, paddingBottom: 40 },
  card: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, marginBottom: t.spacing.lg, ...t.shadows.sm },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center' },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.md, backgroundColor: t.colors.surface, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.border, paddingVertical: t.spacing.lg },
  logoutText: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.danger },
});

export default SettingsScreen;