import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { DJANGO_BASE_URL } from '../config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    console.log('[push] registerForPushNotificationsAsync called');

    if (!Device.isDevice) {
      Alert.alert('Push aborted', 'Device.isDevice is false (emulator?).');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#38bdf8',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Push aborted', `Permission not granted (${finalStatus}).`);
      return null;
    }

    // Native FCM token (Android) — bypasses Expo's push relay.
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const token = tokenResponse.data;
    console.log('FCM device push token:', token);
    Alert.alert('FCM token', token);

    const url = `${DJANGO_BASE_URL}/api/push-tokens/register/`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });
      const text = await res.text();
      console.log(`Register POST → ${url} → ${res.status}: ${text}`);
      if (!res.ok) Alert.alert('Register failed', `${res.status}: ${text}`);
    } catch (e) {
      console.warn('Network error registering push token:', e.message);
      Alert.alert('Register network error', `${url}\n${e.message}`);
    }

    return token;
  } catch (e) {
    console.warn('[push] unexpected error:', e);
    Alert.alert('Push exception', `${e.name}: ${e.message}`);
    return null;
  }
}
