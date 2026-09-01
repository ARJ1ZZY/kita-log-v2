import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const BUSINESS_TYPES = ['Sari-sari Store', 'Ukay-ukay', 'Online Seller', 'Micro-enterprise', 'Other'];

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [company, setCompany] = useState('');
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const fieldAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.spring(logoScale, { toValue: 1, damping: 12, stiffness: 120, useNativeDriver: false }).start();
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(cardTranslateY, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start();
    Animated.stagger(70, fieldAnimations.map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: false })
    )).start();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(email.trim(), password, username.trim(), company.trim(), businessType);
    } catch (e) {
      setErrors({ form: e.message || 'Registration failed' });
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
        <Animated.View style={[styles.brandSection, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>K</Text></View>
          <View style={styles.logoRow}><Text style={styles.logoBlue}>KITA</Text><Text style={styles.logoOrange}>-LOG</Text></View>
          <Text style={styles.tagline}>Start your journey today</Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}>
          <Text style={styles.welcome}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your business profile</Text>

          {errors.form && <Text style={styles.errorBanner}>{errors.form}</Text>}

          <Animated.View style={[styles.inputGroup, { opacity: fieldAnimations[0], transform: [{ translateY: fieldAnimations[0].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Your username" placeholderTextColor={t.colors.medium} value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </Animated.View>

          <Animated.View style={[styles.inputGroup, { opacity: fieldAnimations[1], transform: [{ translateY: fieldAnimations[1].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={t.colors.medium} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </Animated.View>

          <Animated.View style={[styles.inputGroup, { opacity: fieldAnimations[2], transform: [{ translateY: fieldAnimations[2].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Min 6 characters" placeholderTextColor={t.colors.medium} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={t.colors.medium} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </Animated.View>

          <Animated.View style={[styles.inputGroup, { opacity: fieldAnimations[3], transform: [{ translateY: fieldAnimations[3].interpolate({ inputRange: [0,1], outputRange: [10,0] }) }] }]}>
            <Text style={styles.label}>Company (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={18} color={t.colors.medium} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Your business name" placeholderTextColor={t.colors.medium} value={company} onChangeText={setCompany} />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fieldAnimations[4] }}>
            <Text style={styles.label}>Business Type</Text>
            <View style={styles.bizTypeGrid}>
              {BUSINESS_TYPES.map(type => (
                <TouchableOpacity key={type} style={[styles.bizTypeOption, businessType === type && styles.bizTypeActive]} onPress={() => setBusinessType(type)}>
                  <Text style={[styles.bizTypeText, businessType === type && styles.bizTypeTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={[styles.primaryBtn, submitting && styles.btnDisabled]} onPress={handleRegister} disabled={submitting} onPressIn={() => animateButton(true)} onPressOut={() => animateButton(false)} activeOpacity={0.9}>
              {submitting ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.primaryBtnText}>Create Account →</Text>}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.goBack()}>
          <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Sign in here</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: t.spacing.lg },
  brandSection: { alignItems: 'center', marginBottom: t.spacing.xl },
  logoBadge: { width: 56, height: 56, borderRadius: 18, backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: t.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  logoBadgeText: { fontSize: 28, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.white },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoBlue: { fontSize: 28, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary, letterSpacing: -0.5 },
  logoOrange: { fontSize: 28, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.secondary, letterSpacing: -0.5 },
  tagline: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 4 },
  card: { backgroundColor: t.colors.surface, borderRadius: 20, padding: t.spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  welcome: { fontSize: 24, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium, marginBottom: t.spacing.md },
  errorBanner: { color: t.colors.danger, fontSize: 13, fontFamily: t.typography.bodyMedium, marginBottom: 6 },
  inputGroup: { marginBottom: t.spacing.sm },
  label: { fontSize: 11, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, height: 46, position: 'relative' },
  inputIcon: { marginLeft: t.spacing.md },
  input: { flex: 1, paddingHorizontal: t.spacing.sm, fontSize: 15, fontFamily: t.typography.body, color: t.colors.dark, height: '100%', paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', width: 48 },
  errorText: { color: t.colors.danger, fontSize: 11, marginTop: 2, fontFamily: t.typography.body },
  bizTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginBottom: t.spacing.md },
  bizTypeOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border, minWidth: '47%' },
  bizTypeActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  bizTypeText: { fontSize: 12, fontFamily: t.typography.bodyMedium, color: t.colors.medium, textAlign: 'center' },
  bizTypeTextActive: { color: t.colors.white },
  primaryBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: t.spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: t.colors.white, fontSize: 15, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: t.spacing.xl },
  footerText: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium },
  footerLink: { color: t.colors.primary, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
});

export default RegisterScreen;