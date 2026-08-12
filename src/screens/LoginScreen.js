import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Error', 'Enter email and password.'); return; }
    setSubmitting(true);
    try { await login(email.trim(), password); }
    catch (e) { Alert.alert('Error', e.code === 'auth/user-not-found' ? 'No account found.' : 'Login failed.'); }
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
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your account</Text>

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
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={t.colors.medium} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color={t.colors.medium} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity style={styles.checkRow} onPress={() => setRemember(!remember)} activeOpacity={0.7}>
              <Ionicons name={remember ? "checkbox" : "square-outline"} size={20} color={remember ? t.colors.primary : t.colors.medium} />
              <Text style={styles.checkText}>Remember this device</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.signInBtn, submitting && styles.btnDisabled]} onPress={handleLogin} disabled={submitting} activeOpacity={0.8}>
            {submitting ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.signInText}>Sign In →</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={20} color={t.colors.dark} />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
              <Ionicons name="shield-checkmark-outline" size={20} color={t.colors.dark} />
              <Text style={styles.socialText}>SSO</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
          <Text style={styles.footerText}>Don't have an account? <Text style={styles.footerLink}>Create Account</Text></Text>
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
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.xxl },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  checkText: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.medium },
  forgotText: { fontSize: 13, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.primary },
  signInBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center', marginBottom: t.spacing.xxl },
  btnDisabled: { opacity: 0.7 },
  signInText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing.xxl, gap: t.spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: t.colors.border },
  dividerText: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium },
  socialRow: { flexDirection: 'row', gap: t.spacing.md },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.sm, paddingVertical: 12, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.background },
  socialText: { fontSize: 14, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.dark },
  footer: { alignItems: 'center', marginTop: t.spacing.xxl },
  footerText: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium },
  footerLink: { color: t.colors.primary, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default LoginScreen;