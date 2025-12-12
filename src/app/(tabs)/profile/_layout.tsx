// src/app/(tabs)/profile/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      {/* Màn profile chính */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }} // vì bên trong bạn tự vẽ header
      />

      {/* Túi vật phẩm */}
      <Stack.Screen
        name="item"
        options={{ title: 'Túi Vật Phẩm' }} // sẽ dùng header mặc định
      />
    </Stack>
  );
}
