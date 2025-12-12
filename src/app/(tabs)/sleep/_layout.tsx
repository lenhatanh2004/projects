import { Stack } from 'expo-router';

export default function SleepStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="ai-chat"
        options={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />
    </Stack>
  );
}
