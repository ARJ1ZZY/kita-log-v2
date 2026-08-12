import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) { Alert.alert('Error', 'All fields required.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setSubmitting(true);
    try { await register(email.trim(), password, username.trim(), company.trim(), 'Micro-enterprise'); }
    catch (e) { Alert.alert('Error', e.code === 'auth/email-already-in-use' ? 'Email already registered.' : 'Registration failed.'); }
    finally { setSubmitting(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandSection}>
          <View style={styles.logoRow}>
            <Text style={styles.logoBlue}>KITA</Text>
            <Text style={styles.logoOrange}>-LOG</Text>
          </View>
          <Text style={styles.tagline}>Precision Finance for Small Business</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcome}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your business finances</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Your username" placeholderTextColor={t.colors.medium} value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={t.colors.medium} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Min 6 characters" placeholderTextColor={t.colors.medium} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color={t.colors.medium} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Your business name" placeholderTextColor={t.colors.medium} value={company} onChangeText={setCompany} />
            </View>
          </View>

          <TouchableOpacity style={[styles.signInBtn, submitting && styles.btnDisabled]} onPress={handleRegister} disabled={submitting} activeOpacity={0.8}>
            {submitting ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.signInText}>Create Account →</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: t.spacing.xl },
  brandSection: { alignItems: 'center', marginBottom: t.spacing.xxxl },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoBlue: { fontSize: 36, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.primary },
  logoOrange: { fontSize: 36, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.secondary },
  tagline: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: t.spacing.sm },
  card: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, padding: t.spacing.xxl, ...t.shadows.md },
  welcome: { fontSize: 24, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginBottom: t.spacing.xs },
  subtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, marginBottom: t.spacing.xxl },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border },
  inputIcon: { marginLeft: t.spacing.lg },
  input: { flex: 1, paddingHorizontal: t.spacing.md, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  eyeBtn: { padding: t.spacing.md },
  signInBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center', marginTop: t.spacing.md },
  btnDisabled: { opacity: 0.7 },
  signInText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: t.spacing.xxl },
  footerText: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium },
  footerLink: { color: t.colors.primary, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default RegisterScreen;