import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { t } from './src/styles/designSystem';

const Root = () => {
  const { user, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={t.colors.primary} /></View>;
  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.background },
});