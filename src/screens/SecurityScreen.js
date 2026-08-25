import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';
import Toast from '../components/Toast';
import FadeInView from '../components/FadeInView';

const SecurityScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type) => setToast({ visible: true, message: msg, type });

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { showToast('All fields required', 'error'); return; }
    if (newPassword.length < 6) { showToast('Password must be 6+ chars', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      showToast('Password changed', 'success');
      setTimeout(() => onClose(), 500);
    } catch (e) {
      showToast(e.code === 'auth/wrong-password' ? 'Incorrect current password' : 'Failed', 'error');
    }
    setLoading(false);
  };

  return (
    <FadeInView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={t.colors.dark} /></TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.desc}>Change your account password.</Text>
        <View style={styles.inputGroup}><Text style={styles.label}>Current Password</Text><TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="••••••" placeholderTextColor={t.colors.medium} /></View>
        <View style={styles.inputGroup}><Text style={styles.label}>New Password</Text><TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Min 6 characters" placeholderTextColor={t.colors.medium} /></View>
        <View style={styles.inputGroup}><Text style={styles.label}>Confirm Password</Text><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Re-enter password" placeholderTextColor={t.colors.medium} /></View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleChange} disabled={loading}>
          {loading ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Change Password</Text>}
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
  desc: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium, marginBottom: t.spacing.xxl },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.surface, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 52 },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: t.spacing.lg },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
});

export default SecurityScreen;