import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';
import Toast from '../components/Toast';
import { setNotificationsEnabled, isNotificationsEnabled, registerForPushNotificationsAsync, scheduleDailySummaryNotification } from '../services/notificationService';

const CURRENCIES = [
  { label: 'US Dollar', symbol: '$' },
  { label: 'Philippine Peso', symbol: '₱' },
];

const DATE_FORMATS = [
  { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
  { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
];

const PreferencesScreen = ({ onClose }) => {
  const { user, settings, updateSettings } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(settings?.currency_symbol || '₱');
  const [selectedDateFormat, setSelectedDateFormat] = useState(settings?.date_format || 'MM/DD/YYYY');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (settings) {
      setSelectedCurrency(settings.currency_symbol || '₱');
      setSelectedDateFormat(settings.date_format || 'MM/DD/YYYY');
    }
    isNotificationsEnabled().then(setNotificationsEnabledState);
  }, [settings]);

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const handleSave = async () => {
    setLoading(true);
    await updateSettings({ currency_symbol: selectedCurrency, date_format: selectedDateFormat });
    setLoading(false);
    showToast('Preferences saved', 'success');
    onClose();
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabledState(value);
    await setNotificationsEnabled(value);
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (token && Platform.OS !== 'web') {
        // Store token in user settings
        await updateSettings({ notification_token: token });
      }
      await scheduleDailySummaryNotification(20, 0); // 8 PM
      showToast('Notifications enabled', 'success');
    } else {
      await scheduleDailySummaryNotification(20, 0).catch(() => {});
      showToast('Notifications disabled', 'info');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={t.colors.dark} /></TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Currency</Text>
        <View style={styles.optionRow}>
          {CURRENCIES.map(c => (
            <TouchableOpacity
              key={c.symbol}
              style={[styles.optionChip, selectedCurrency === c.symbol && styles.optionChipActive]}
              onPress={() => setSelectedCurrency(c.symbol)}
            >
              <Text style={[styles.optionSymbol, selectedCurrency === c.symbol && styles.optionSymbolActive]}>{c.symbol}</Text>
              <Text style={[styles.optionLabel, selectedCurrency === c.symbol && styles.optionLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Date Format</Text>
        <View style={styles.optionRow}>
          {DATE_FORMATS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.optionChip, selectedDateFormat === f.value && styles.optionChipActive]}
              onPress={() => setSelectedDateFormat(f.value)}
            >
              <Text style={[styles.optionLabel, selectedDateFormat === f.value && styles.optionLabelActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Enable daily summary & alerts</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: t.colors.border, true: t.colors.primary }}
            thumbColor={t.colors.white}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Save Preferences</Text>}
        </TouchableOpacity>
      </ScrollView>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  content: { padding: t.spacing.xl },
  sectionLabel: { fontSize: 14, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.md, marginTop: t.spacing.lg },
  optionRow: { flexDirection: 'row', gap: t.spacing.md, flexWrap: 'wrap' },
  optionChip: { paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md, borderRadius: t.radius.button, borderWidth: 1.5, borderColor: t.colors.border, alignItems: 'center', minWidth: 100 },
  optionChipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  optionSymbol: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginBottom: 2 },
  optionSymbolActive: { color: t.colors.white },
  optionLabel: { fontSize: 12, fontFamily: t.typography.bodyMedium, color: t.colors.medium },
  optionLabelActive: { color: t.colors.white },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: t.spacing.md },
  switchLabel: { fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: t.spacing.xxxl },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
});

export default PreferencesScreen;