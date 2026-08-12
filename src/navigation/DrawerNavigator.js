import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TabNavigator from './TabNavigator';
import SearchScreen from '../screens/SearchScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BackupScreen from '../screens/BackupScreen';
import HeaderBar from '../components/HeaderBar';
import { useAuth } from '../context/AuthContext';
import { theme, Colors, Spacing, BorderRadius, Shadows } from '../styles/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

const DrawerNavigator = () => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [searchVisible, setSearchVisible] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const navigateTo = (screen) => { setCurrentScreen(screen); closeDrawer(); };

  const renderScreen = () => {
    if (searchVisible) return <SearchScreen onClose={() => setSearchVisible(false)} />;
    const ScreenComponent = {
      Settings: SettingsScreen, Reports: ReportsScreen, Backup: BackupScreen, Home: null,
    }[currentScreen];

    return (
      <View style={styles.screenWrapper}>
        <HeaderBar onMenuPress={openDrawer} onSearchPress={() => setSearchVisible(true)} />
        {ScreenComponent ? <ScreenComponent /> : <TabNavigator />}
      </View>
    );
  };

  const menuItems = [
    { name: 'Home', label: 'Dashboard', icon: 'home-outline', activeIcon: 'home' },
    { name: 'Settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
    { name: 'Reports', label: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
    { name: 'Backup', label: 'Backup', icon: 'cloud-upload-outline', activeIcon: 'cloud-upload' },
  ];

  return (
    <View style={styles.root}>
      {renderScreen()}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.drawerWrapper}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={28} color={theme.white} />
              </View>
              <View style={styles.drawerUserInfo}>
                <Text style={styles.drawerName} numberOfLines={1}>{user?.username || 'User'}</Text>
                <Text style={styles.drawerEmail} numberOfLines={1}>{user?.email || ''}</Text>
                {user?.company_name && <Text style={styles.drawerCompany} numberOfLines={1}>{user.company_name}</Text>}
              </View>
            </View>
            <View style={styles.divider} />
            {menuItems.map(item => {
              const isActive = currentScreen === item.name;
              return (
                <TouchableOpacity key={item.name} style={[styles.menuItem, isActive && styles.menuItemActive]} onPress={() => navigateTo(item.name)} activeOpacity={0.6}>
                  <Ionicons name={isActive ? item.activeIcon : item.icon} size={20} color={isActive ? Colors.light.primary : Colors.light.secondaryText} />
                  <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
            <View style={styles.spacer} />
            <View style={styles.divider} />
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.6}>
              <Ionicons name="log-out-outline" size={20} color={Colors.light.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  screenWrapper: { flex: 1, backgroundColor: theme.background },
  drawerWrapper: { flex: 1, flexDirection: 'row' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.overlay },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH,
    backgroundColor: theme.cardBackground, paddingTop: 56, paddingHorizontal: Spacing.xl,
    ...Shadows.xl, borderRightWidth: 0.5, borderRightColor: theme.border,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xxl, marginTop: Spacing.sm },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#6699CC',
    justifyContent: 'center', alignItems: 'center', ...Shadows.md,
  },
  drawerUserInfo: { flex: 1 },
  drawerName: { fontSize: 17, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '900', color: theme.primaryText },
  drawerEmail: { fontSize: 13, fontFamily: 'Inter-Regular', color: theme.secondaryText, marginTop: 2 },
  drawerCompany: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#6699CC', marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: Spacing.lg },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, marginBottom: 2,
  },
  menuItemActive: { backgroundColor: Colors.light.primary + '08' },
  menuLabel: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: Colors.light.secondaryText, flex: 1 },
  menuLabelActive: { color: Colors.light.primary },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6699CC' },
  spacer: { flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.xl },
  logoutText: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: Colors.light.danger },
});

export default DrawerNavigator;