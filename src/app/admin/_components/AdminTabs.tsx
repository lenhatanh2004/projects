import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const C = { card: '#FFFFFF', text: '#111111', border: '#E9E9EF', dark: '#0F172A' };

export default function AdminTabs() {
  const pathname = usePathname();     // '/admin/dashboard' | '/admin/users' | '/admin'
  const router = useRouter();

  const isDash = pathname?.startsWith('/admin/dashboard') || pathname === '/admin';
  const isUsers = pathname?.startsWith('/admin/users');

  const TabBtn = ({
    active, icon, label, onPress,
  }: { active: boolean; icon: React.ReactNode; label: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
        backgroundColor: active ? C.dark : C.card,
        borderWidth: active ? 0 : 1, borderColor: C.border, marginRight: 10,
      }}
    >
      {icon}
      <Text style={{ marginLeft: 8, fontWeight: active ? '800' : '700', color: active ? '#FFF' : C.text }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flexDirection: 'row', margin: 16 }}>
      <TabBtn
        active={isDash}
        onPress={() => router.replace('/admin/dashboard')}
        icon={<MaterialCommunityIcons name="view-dashboard-outline" size={18} color={isDash ? '#FFF' : C.text} />}
        label="Dashboard"
      />
      <TabBtn
        active={isUsers}
        onPress={() => router.replace('/admin/users')}
        icon={<Ionicons name="people-outline" size={18} color={isUsers ? '#FFF' : C.text} />}
        label="Quản lý tài khoản"
      />
    </View>
  );
}