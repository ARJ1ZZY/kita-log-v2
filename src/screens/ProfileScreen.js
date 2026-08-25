import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';
import PressableScale from '../components/PressableScale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FadeInView = ({ children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const ProfileScreen = ({
  onClose,
  onPersonalPress,
  onSecurityPress,
  onPreferencesPress,
  onReportsPress,
  onBackupPress,
  onRecurringPress,
}) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Personal Info',
      subtitle: 'Name, email, company',
      action: onPersonalPress,
      color: t.colors.primary,
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Security',
      subtitle: 'Change password',
      action: onSecurityPress,
      color: t.colors.success,
    },
    {
      icon: 'options-outline',
      label: 'Preferences',
      subtitle: 'Currency, date format',
      action: onPreferencesPress,
      color: t.colors.secondary,
    },
    {
      icon: 'repeat-outline',
      label: 'Recurring',
      subtitle: 'Manage recurring bills',
      action: onRecurringPress,
      color: '#8B5CF6',
    },
    {
      icon: 'bar-chart-outline',
      label: 'Reports',
      subtitle: 'Export & analytics',
      action: onReportsPress,
      color: '#EC4899',
    },
    {
      icon: 'cloud-upload-outline',
      label: 'Backup',
      subtitle: 'Export your data',
      action: onBackupPress,
      color: '#14B8A6',
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      subtitle: 'FAQs, contact us',
      action: () => Alert.alert('Help', 'Contact support@kita-log.com'),
      color: '#6366F1',
    },
  ];

  const userInitial = user?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark" size={12} color={t.colors.white} />
              </View>
            </View>
            <Text style={styles.userName}>{user?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            {user?.company_name && (
              <View style={styles.companyBadge}>
                <Ionicons name="business-outline" size={14} color={t.colors.primary} />
                <Text style={styles.companyText}>{user.company_name}</Text>
              </View>
            )}
          </View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <PressableScale
                key={item.label}
                onPress={item.action}
                style={[styles.menuCard, index % 2 === 0 ? styles.menuCardLeft : styles.menuCardRight]}
                activeOpacity={0.8}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.menuLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.menuSubtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
                <View style={styles.menuArrow}>
                  <Ionicons name="chevron-forward" size={16} color={t.colors.medium} />
                </View>
              </PressableScale>
            ))}
          </View>

          {/* Logout Button */}
          <PressableScale onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={t.colors.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </PressableScale>

          {/* Version */}
          <Text style={styles.versionText}>KITA-LOG v1.0.0</Text>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: t.typography.heading,
    fontWeight: '800',
    color: t.colors.dark,
  },
  scrollContent: {
    paddingHorizontal: t.spacing.lg,
    paddingTop: t.spacing.xl,
  },
  userCard: {
    backgroundColor: t.colors.surface,
    borderRadius: 24,
    padding: t.spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.colors.border,
    ...t.shadows.md,
    marginBottom: t.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: t.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: t.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...t.shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: t.typography.heading,
    fontWeight: '800',
    color: t.colors.white,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: t.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: t.colors.surface,
  },
  userName: {
    fontSize: 22,
    fontFamily: t.typography.heading,
    fontWeight: '800',
    color: t.colors.dark,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: t.typography.body,
    color: t.colors.medium,
    marginBottom: t.spacing.sm,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: t.colors.primaryLight,
    paddingHorizontal: t.spacing.md,
    paddingVertical: 4,
    borderRadius: t.radius.pill,
  },
  companyText: {
    fontSize: 13,
    fontFamily: t.typography.bodyMedium,
    color: t.colors.primary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: t.spacing.md,
    marginBottom: t.spacing.xl,
  },
  menuCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 48 - t.spacing.md) / 2,
    backgroundColor: t.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.lg,
    ...t.shadows.sm,
    position: 'relative',
  },
  menuCardLeft: {
    // No extra margin needed, gap handles spacing
  },
  menuCardRight: {
    // No extra margin needed, gap handles spacing
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: t.spacing.sm,
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: t.typography.bodySemiBold,
    fontWeight: '600',
    color: t.colors.dark,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11,
    fontFamily: t.typography.body,
    color: t.colors.medium,
    opacity: 0.8,
  },
  menuArrow: {
    position: 'absolute',
    top: t.spacing.md,
    right: t.spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.button,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingVertical: 16,
    marginBottom: t.spacing.xl,
    ...t.shadows.sm,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: t.typography.bodySemiBold,
    fontWeight: '600',
    color: t.colors.danger,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: t.typography.body,
    color: t.colors.medium,
    opacity: 0.6,
  },
});

export default ProfileScreen;