// app/_layout.tsx
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Web: dùng Web Notifications API (Expo notifications không hoạt động trên web)
    if (Platform.OS === 'web') {
      if (typeof Notification !== 'undefined') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Web notifications enabled', {
              body: 'You will receive web alerts while this tab is open.',
            });
          } else {
            console.warn('Web notifications permission was not granted');
          }
        });
      } else {
        console.warn('Web Notifications API is not supported in this browser');
      }
      return;
    }

    // Khi app đang mở, nhận notification
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('New notification', notification.request.content.body || 'You have a new notification');
        
        alert(notification.request.content.body || 'You have a new notification');
      });

    // Khi user bấm vào notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        alert('Notification opened');
        const data = response.notification.request.content.data as any;

        if (data?.habitId) {
          router.push({
            pathname: '/(tabs)/habits/RunningHabitTracker',
            params: { habitId: String(data.habitId) },
          });
        }
      });

    return () => {
      // ✅ Expo SDK mới: mỗi subscription có .remove()
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    <Toast />
    </>
  );
}
