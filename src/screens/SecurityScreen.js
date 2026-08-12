import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const SecurityScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { Alert.alert('Required', 'All fields are required.'); return; }
    if (newPassword.length < 6) { Alert.alert('Invalid', 'New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Success', 'Password changed successfully.');
      onClose();
    } catch (e) {
      Alert.alert('Error', e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to change password.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Security</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>Change your account password. You'll need your current password to continue.</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="••••••" placeholderTextColor={t.colors.medium} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Min 6 characters" placeholderTextColor={t.colors.medium} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Re-enter password" placeholderTextColor={t.colors.medium} />
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleChange} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Change Password</Text>}
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
  description: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, marginBottom: t.spacing.xxl, lineHeight: 20 },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.surface, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center', marginTop: t.spacing.lg },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default SecurityScreen;