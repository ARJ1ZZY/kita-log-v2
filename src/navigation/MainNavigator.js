import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import BottomNav from '../components/BottomNav';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import InventoryScreen from '../screens/InventoryScreen';
import InsightsScreen from '../screens/InsightsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import SecurityScreen from '../screens/SecurityScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BackupScreen from '../screens/BackupScreen';
import RecurringTransactionsScreen from '../screens/RecurringTransactionsScreen';
import BusinessSwitcherModal from '../components/BusinessSwitcherModal';
import AddBusinessScreen from '../screens/AddBusinessScreen';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const MainNavigator = () => {
  const { showAddBusinessModal } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentScreen, setCurrentScreen] = useState(null);
  const [businessSwitcherVisible, setBusinessSwitcherVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabPress = (tab) => { setCurrentScreen(null); setActiveTab(tab); };
  const goBackToProfile = () => setCurrentScreen('Profile');
  const handleTransactionAdded = () => setRefreshKey(prev => prev + 1);

  if (currentScreen === 'Notifications') return <NotificationsScreen onClose={() => setCurrentScreen(null)} />;
  if (currentScreen === 'Profile') return (
    <ProfileScreen
      onClose={() => setCurrentScreen(null)}
      onPersonalPress={() => setCurrentScreen('PersonalInfo')}
      onSecurityPress={() => setCurrentScreen('Security')}
      onPreferencesPress={() => setCurrentScreen('Preferences')}
      onReportsPress={() => setCurrentScreen('Reports')}
      onBackupPress={() => setCurrentScreen('Backup')}
      onRecurringPress={() => setCurrentScreen('Recurring')}
    />
  );
  if (currentScreen === 'PersonalInfo') return <PersonalInfoScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Security') return <SecurityScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Preferences') return <PreferencesScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Reports') return <ReportsScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Backup') return <BackupScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Recurring') return <RecurringTransactionsScreen onClose={goBackToProfile} />;

  if (showAddBusinessModal) {
    return <AddBusinessScreen />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Transactions': return <TransactionsScreen refreshKey={refreshKey} />;
      case 'Stock': return <InventoryScreen />;
      case 'Insights': return <InsightsScreen />;
      default: return <DashboardScreen navigation={{ navigate: handleTabPress }} />;
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        onProfilePress={() => setCurrentScreen('Profile')}
        onBusinessPress={() => setBusinessSwitcherVisible(true)}
      />
      <View style={styles.content}>{renderScreen()}</View>
      <BottomNav
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onTransactionAdded={handleTransactionAdded}
      />
      <BusinessSwitcherModal
        visible={businessSwitcherVisible}
        onClose={() => setBusinessSwitcherVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  content: { flex: 1 },
});

export default MainNavigator;