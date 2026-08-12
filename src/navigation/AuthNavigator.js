import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { t } from '../styles/designSystem';

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: t.colors.background } }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;