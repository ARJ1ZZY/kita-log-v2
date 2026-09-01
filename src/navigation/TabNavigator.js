import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, StatusBar, Animated, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import InventoryScreen from '../screens/InventoryScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import { theme, Colors, Spacing, BorderRadius, TouchTargets, Shadows } from '../styles/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const QuickAddModal = ({ visible, onClose, navigation }) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 180, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }).start(() => setShow(false));
    }
  }, [visible]);

  if (!show && !visible) return null;
  if (!navigation) return null;

  return (
    <Modal visible={show} transparent animationType="none" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Transaction</Text>
          <TouchableOpacity style={[styles.quickOption, styles.saleOption]} onPress={() => { onClose(); navigation.navigate('Transact', { openAdd: true, type: 'sale' }); }} activeOpacity={0.7}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.light.success + '15' }]}>
              <Ionicons name="cart-outline" size={24} color={Colors.light.success} />
            </View>
            <View style={styles.quickInfo}>
              <Text style={styles.quickLabel}>Add Sale</Text>
              <Text style={styles.quickDesc}>Record income from a sale</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickOption, styles.expenseOption]} onPress={() => { onClose(); navigation.navigate('Transact', { openAdd: true, type: 'expense' }); }} activeOpacity={0.7}>
            <View style={[styles.quickIcon, { backgroundColor: Colors.light.danger + '15' }]}>
              <Ionicons name="wallet-outline" size={24} color={Colors.light.danger} />
            </View>
            <View style={styles.quickInfo}>
              <Text style={styles.quickLabel}>Add Expense</Text>
              <Text style={styles.quickDesc}>Record a business expense</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const FabButton = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, damping: 10, stiffness: 200, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.fabWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity style={styles.fab} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
        <Ionicons name="add" size={28} color={theme.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const TabNavigator = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigationRef = useRef(null);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Overview: focused ? 'pie-chart' : 'pie-chart-outline',
              Transact: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
              Stock: focused ? 'cube' : 'cube-outline',
              Budgets: focused ? 'wallet' : 'wallet-outline',
            };
            return <Ionicons name={icons[route.name] || 'help-circle-outline'} size={22} color={color} />;
          },
          tabBarActiveTintColor: '#6699CC',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: theme.navBackground,
            borderTopColor: 'transparent',
            height: 70,
            paddingBottom: 8,
            paddingTop: 6,
            ...Shadows.lg,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            fontFamily: 'Inter-Bold',
            marginTop: 2,
          },
          tabBarItemStyle: { minHeight: TouchTargets.minimum, paddingVertical: 2 },
        })}
      >
        <Tab.Screen name="Overview" component={DashboardScreen} />
        <Tab.Screen name="Transact" component={TransactionsScreen} />
        <Tab.Screen
          name="QuickAdd"
          component={View}
          options={{
            tabBarButton: () => <FabButton onPress={() => setModalVisible(true)} />,
            tabBarLabel: () => null,
          }}
          listeners={({ navigation }) => { navigationRef.current = navigation; return {}; }}
        />
        <Tab.Screen name="Stock" component={InventoryScreen} />
        <Tab.Screen name="Budgets" component={BudgetsScreen} />
      </Tab.Navigator>
      <QuickAddModal visible={modalVisible} onClose={() => setModalVisible(false)} navigation={navigationRef.current} />
    </>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    alignItems: 'center', justifyContent: 'center',
    width: 56, height: 56, marginTop: -22,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6699CC', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#FFFFFF',
    ...Shadows.xl,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.overlay },
  modalSheet: {
    backgroundColor: theme.cardBackground, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 5, backgroundColor: theme.border, borderRadius: 3, alignSelf: 'center', marginBottom: Spacing.xxl },
  modalTitle: { fontSize: 22, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '900', color: theme.primaryText, marginBottom: Spacing.xl, textAlign: 'center' },
  quickOption: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md, borderWidth: 1.5, minHeight: 76,
  },
  saleOption: { borderColor: Colors.light.success + '30', backgroundColor: Colors.light.success + '06' },
  expenseOption: { borderColor: Colors.light.danger + '30', backgroundColor: Colors.light.danger + '06' },
  quickIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.lg },
  quickInfo: { flex: 1 },
  quickLabel: { fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: theme.primaryText },
  quickDesc: { fontSize: 12, fontFamily: 'Inter-Regular', color: theme.secondaryText, marginTop: 2 },
  cancelBtn: {
    backgroundColor: theme.background, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm,
    minHeight: TouchTargets.minimum + 4,
  },
  cancelBtnText: { fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: theme.secondaryText },
});

export default TabNavigator;