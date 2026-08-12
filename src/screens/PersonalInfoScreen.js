import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const PersonalInfoScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', company: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ username: user.username || '', email: user.email || '', company: user.company_name || '' });
  }, [user]);

  const handleSave = async () => {
    if (!form.username.trim()) { Alert.alert('Required', 'Username cannot be empty.'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { username: form.username.trim(), company_name: form.company.trim() });
      Alert.alert('Saved', 'Personal info updated.');
      onClose();
    } catch { Alert.alert('Error', 'Failed to save.'); }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Personal Info</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={form.username} onChangeText={t => setForm({...form, username: t})} placeholder="Username" placeholderTextColor={t.colors.medium} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={form.email} editable={false} placeholderTextColor={t.colors.medium} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Company</Text>
          <TextInput style={styles.input} value={form.company} onChangeText={t => setForm({...form, company: t})} placeholder="Business name" placeholderTextColor={t.colors.medium} />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Save Changes</Text>}
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
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center', marginTop: t.spacing.lg },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default PersonalInfoScreen;