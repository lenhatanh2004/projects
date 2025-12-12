// utils/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { getBaseUrl } from '../server/users';

// 1. Configure notification behavior (show alert/sound/badge)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// 2. Request notification permissions + Android channel
export async function ensureNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habit_reminders', {
      name: 'Habit Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Cần quyền thông báo', 'Vui lòng cấp quyền để nhận thông báo.');
    return false;
  }

  return true;
}

/**
 * 3. Schedule reminder (one-off or weekly repeat)
 */
export async function scheduleReminder(title, body, hour, minute, weekdays = []) {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) return null;

  // Repeat on specific weekdays
  if (weekdays.length > 0) {
    const ids = [];
    for (const day of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: { hour, minute, weekday: day, repeats: true },
      });
      ids.push(id);
    }
    return ids;
  }

  // One-time notification
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: { hour, minute, repeats: false },
  });
  return [id];
}

// 4. Cancel specific reminders
export async function cancelReminder(notificationIds) {
  if (!notificationIds) return;
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

// 5. Cancel all reminders (e.g., logout)
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * 6. Register push (Expo push token -> backend FCM register)
 */
export async function registerForPushNotifications(authToken) {
  try {
    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) return null;

    if (!Device.isDevice) {
      Alert.alert('Yêu cầu thiết bị thật', 'Push notification chỉ hoạt động trên thiết bị vật lý.');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      undefined;

    const { data: expoToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    // Send token to backend
    if (authToken && expoToken) {
      const base = getBaseUrl();
      try {
        await fetch(`${base}/api/fcm/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token: expoToken,
            device: Platform.OS,
            deviceId: Device.osInternalBuildId || Device.osBuildId || null,
          }),
        });
      } catch (err) {
        console.warn('[registerForPushNotifications] failed to register token with backend:', err);
      }
    }

    return expoToken || null;
  } catch (err) {
    console.warn('[registerForPushNotifications] error:', err);
    return null;
  }
}

// 7. Unregister push token on logout
export async function unregisterPushNotifications(authToken, fcmToken) {
  try {
    if (!authToken || !fcmToken) return;
    const base = getBaseUrl();
    await fetch(`${base}/api/fcm/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
  } catch (err) {
    console.warn('[unregisterPushNotifications] error:', err);
  }
}
