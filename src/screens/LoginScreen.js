import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../../firebase';
import { t } from '../styles/designSystem';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Staggered field animations
  const fieldAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Logo bounce
    Animated.spring(logoScale, {
      toValue: 1,
      damping: 12,
      stiffness: 120,
      useNativeDriver: false,
    }).start();

    // Card fade + slide
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();

    // Stagger field animations
    Animated.stagger(80, fieldAnimations.map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: false })
    )).start();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim() && !resetMode) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      const message = e.code === 'auth/user-not-found' ? 'No account found' : e.message || 'Login failed';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email first' });
      return;
    }
    setSubmitting(true);
    try {
      await authAPI.sendPasswordReset(email.trim());
      setResetMode(false);
      setErrors({ form: 'Reset link sent' });
    } catch (e) {
      setErrors({ form: e.message || 'Failed to send reset email' });
    } finally {
      setSubmitting(false);
    }
  };

  const animateButton = (pressed) => {
    Animated.spring(buttonScale, {
      toValue: pressed ? 0.97 : 1,
      damping: 15,
      stiffness: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Animated Brand */}
        <Animated.View style={[styles.brandSection, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>K</Text></View>
          <View style={styles.logoRow}><Text style={styles.logoBlue}>KITA</Text><Text style={styles.logoOrange}>-LOG</Text></View>
          <Text style={styles.tagline}>Precision Finance for Small Business</Text>
        </Animated.View>

        {/* Animated Card */}
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
          <Text style={styles.welcome}>{resetMode ? 'Reset Password' : 'Welcome back'}</Text>
          <Text style={styles.subtitle}>{resetMode ? 'Enter your email to receive a reset link' : 'Sign in to continue your journey'}</Text>

          {errors.form && <Text style={styles.errorBanner}>{errors.form}</Text>}

          {/* Email Field */}
          <Animated.View style={[styles.inputGroup, { opacity: fieldAnimations[0], transform: [{ translateY: fieldAnimations[0].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={t.colors.medium} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </Animated.View>

          {/* Password Field */}
          {!resetMode && (
            <Animated.View style={[styles.inputGroup, { opacity: fieldAnimations[1], transform: [{ translateY: fieldAnimations[1].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={t.colors.medium} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={t.colors.medium} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </Animated.View>
          )}

          {/* Options Row */}
          {!resetMode && (
            <Animated.View style={[styles.optionsRow, { opacity: fieldAnimations[2], transform: [{ translateY: fieldAnimations[2].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
              <TouchableOpacity style={styles.checkRow} onPress={() => setRemember(!remember)}>
                <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={20} color={remember ? t.colors.primary : t.colors.medium} />
                <Text style={styles.checkText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setResetMode(true)}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Button */}
          <Animated.View style={[styles.buttonWrapper, { opacity: fieldAnimations[3], transform: [{ scale: buttonScale }] }]}>
            {resetMode ? (
              <>
                <TouchableOpacity style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleForgotPassword} disabled={submitting} onPressIn={() => animateButton(true)} onPressOut={() => animateButton(false)} activeOpacity={0.9}>
                  {submitting ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.primaryBtnText}>Send Reset Link</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setResetMode(false)}>
                  <Text style={styles.secondaryBtnText}>← Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleLogin} disabled={submitting} onPressIn={() => animateButton(true)} onPressOut={() => animateButton(false)} activeOpacity={0.9}>
                {submitting ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.primaryBtnText}>Sign In →</Text>}
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {!resetMode && (
          <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerText}>New here? <Text style={styles.footerLink}>Create Account</Text></Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: t.spacing.xl },
  brandSection: { alignItems: 'center', marginBottom: t.spacing.xxxl },
  logoBadge: { width: 64, height: 64, borderRadius: 20, backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: t.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoBadgeText: { fontSize: 32, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.white },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoBlue: { fontSize: 32, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary, letterSpacing: -0.5 },
  logoOrange: { fontSize: 32, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.secondary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium, marginTop: t.spacing.sm },
  card: { backgroundColor: t.colors.surface, borderRadius: 24, padding: t.spacing.xxl, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  welcome: { fontSize: 28, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginBottom: 4 },
  subtitle: { fontSize: 15, fontFamily: t.typography.body, color: t.colors.medium, marginBottom: t.spacing.xxl },
  errorBanner: { color: t.colors.danger, fontSize: 14, fontFamily: t.typography.bodyMedium, marginBottom: 8 },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, height: 52, position: 'relative' },
  inputIcon: { marginLeft: t.spacing.lg },
  input: { flex: 1, paddingHorizontal: t.spacing.md, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: '100%', paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', width: 48 },
  errorText: { color: t.colors.danger, fontSize: 12, marginTop: 4, fontFamily: t.typography.body },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.xxl },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
  checkText: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium },
  forgotText: { fontSize: 13, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.primary },
  buttonWrapper: { marginBottom: t.spacing.lg },
  primaryBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  secondaryBtn: { alignItems: 'center', paddingVertical: t.spacing.md },
  secondaryBtnText: { fontSize: 14, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.primary },
  footer: { alignItems: 'center', marginTop: t.spacing.xxl },
  footerText: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium },
  footerLink: { color: t.colors.primary, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
});

export default LoginScreen;