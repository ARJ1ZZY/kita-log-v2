import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';
import Toast from '../components/Toast';
import FadeInView from '../components/FadeInView';

const PersonalInfoScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (user) setForm({ username: user.username || '', email: user.email || '', company: user.company_name || '' });
  }, [user]);

  const showToast = (msg, type) => setToast({ visible: true, message: msg, type });

  const handleSave = async () => {
    if (!form.username.trim()) { showToast('Username required', 'error'); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { username: form.username.trim(), company_name: form.company.trim() });
      showToast('Profile updated', 'success');
      setTimeout(() => onClose(), 500);
    } catch { showToast('Save failed', 'error'); }
    setLoading(false);
  };

  return (
    <FadeInView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={t.colors.dark} /></TouchableOpacity>
        <Text style={styles.title}>Personal Info</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.inputGroup}><Text style={styles.label}>Username</Text><TextInput style={styles.input} value={form.username} onChangeText={x => setForm({...form, username: x})} placeholder="Username" placeholderTextColor={t.colors.medium} /></View>
        <View style={styles.inputGroup}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={form.email} editable={false} /></View>
        <View style={styles.inputGroup}><Text style={styles.label}>Company</Text><TextInput style={styles.input} value={form.company} onChangeText={x => setForm({...form, company: x})} placeholder="Business name" placeholderTextColor={t.colors.medium} /></View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  content: { padding: t.spacing.xl },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.surface, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 52 },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: t.spacing.lg },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
});

export default PersonalInfoScreen;