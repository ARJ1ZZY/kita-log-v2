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
import { t } from '../styles/designSystem';

const MainNavigator = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [currentScreen, setCurrentScreen] = useState(null);

  const handleTabPress = (tab) => { setCurrentScreen(null); setActiveTab(tab); };

  const goBackToProfile = () => setCurrentScreen('Profile');

  if (currentScreen === 'Notifications') return <NotificationsScreen onClose={() => setCurrentScreen(null)} />;
  if (currentScreen === 'Profile') return <ProfileScreen onClose={() => setCurrentScreen(null)} onPersonalPress={() => setCurrentScreen('PersonalInfo')} onSecurityPress={() => setCurrentScreen('Security')} onPreferencesPress={() => setCurrentScreen('Preferences')} onReportsPress={() => setCurrentScreen('Reports')} onBackupPress={() => setCurrentScreen('Backup')} />;
  if (currentScreen === 'PersonalInfo') return <PersonalInfoScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Security') return <SecurityScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Preferences') return <PreferencesScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Reports') return <ReportsScreen onClose={goBackToProfile} />;
  if (currentScreen === 'Backup') return <BackupScreen onClose={goBackToProfile} />;

  const renderScreen = () => {
    switch (activeTab) {
      case 'Transactions': return <TransactionsScreen />;
      case 'Stock': return <InventoryScreen />;
      case 'Insights': return <InsightsScreen />;
      default: return <DashboardScreen navigation={{ navigate: handleTabPress }} />;
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar onProfilePress={() => setCurrentScreen('Profile')} />
      <View style={styles.content}>{renderScreen()}</View>
      <BottomNav activeTab={activeTab} onTabPress={handleTabPress} navigation={{ navigate: handleTabPress }} />
    </View>
  );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: t.colors.background }, content: { flex: 1 } });

export default MainNavigator;