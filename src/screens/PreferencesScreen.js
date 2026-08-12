import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Switch, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getSingleDocument, setDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const PreferencesScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('$');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const settings = await getSingleDocument('user_settings', user.uid);
      if (settings) {
        setCurrency(settings.currency_symbol || '$');
        setDateFormat(settings.date_format || 'MM/DD/YYYY');
        setDarkMode(settings.theme === 'dark');
      }
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    await setDocument('user_settings', user.uid, { currency_symbol: currency, date_format: dateFormat, theme: darkMode ? 'dark' : 'light' });
    setLoading(false);
    Alert.alert('Saved', 'Preferences updated.');
    onClose();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Currency Symbol</Text>
          <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="$" placeholderTextColor={t.colors.medium} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date Format</Text>
          <TextInput style={styles.input} value={dateFormat} onChangeText={setDateFormat} placeholder="MM/DD/YYYY" placeholderTextColor={t.colors.medium} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: t.colors.border, true: t.colors.primary }} thumbColor={t.colors.white} />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Save Preferences</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  content: { padding: t.spacing.xl },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.surface, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center', marginTop: t.spacing.lg },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default PreferencesScreen;