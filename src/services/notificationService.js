import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_TOKEN_KEY = '@kita_log_notification_token';
const NOTIFICATIONS_ENABLED_KEY = '@kita_log_notifications_enabled';

export async function isNotificationsEnabled() {
  const value = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return value === 'true';
}

export async function setNotificationsEnabled(enabled) {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  if (!(await isNotificationsEnabled())) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for notifications!');
    return null;
  }
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
  return token;
}

export async function getStoredNotificationToken() {
  return await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
}

export async function scheduleDailySummaryNotification(hour = 20, minute = 0) {
  if (Platform.OS === 'web') return;
  if (!(await isNotificationsEnabled())) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'KITA-LOG Daily Summary',
      body: 'Your daily business summary is ready. Tap to view.',
      data: { screen: 'Dashboard' },
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function sendLocalNotification(title, body, data = {}) {
  if (Platform.OS === 'web') return;
  if (!(await isNotificationsEnabled())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}