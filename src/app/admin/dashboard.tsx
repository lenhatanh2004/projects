// src/app/admin/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getAllUsers } from '../../server/users'; 

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalNormalUsers: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllUsers({ page: 1, limit: 100 });
        const data = res?.data || res;
        const users = data.users || data.data?.users || [];
        const totalUsers = data.pagination?.totalUsers || users.length;

        const totalAdmins = users.filter((u: any) => u.role === 'admin').length;
        const totalNormalUsers = users.filter((u: any) => u.role !== 'admin').length;
        const activeUsers = users.filter((u: any) => u.isActive !== false).length;

        setStats({
          totalUsers,
          totalAdmins,
          totalNormalUsers,
          activeUsers,
        });
      } catch (e) {
        console.log('AdminDashboard error', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Admin Dashboard', headerShown: true }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: COLORS.subtext }}>Đang tải thống kê...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 12 }}>
              Tổng quan tài khoản
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <StatCard icon="people-outline" label="Tổng tài khoản" value={stats.totalUsers} />
              <StatCard icon="shield-checkmark-outline" label="Admin" value={stats.totalAdmins} />
              <StatCard icon="person-outline" label="Người dùng" value={stats.totalNormalUsers} />
              <StatCard icon="checkmark-circle-outline" label="Đang hoạt động" value={stats.activeUsers} />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <View
      style={{
        flexBasis: '48%',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 14,
      }}
    >
      <Ionicons name={icon} size={22} color={COLORS.text} />
      <Text style={{ marginTop: 8, fontSize: 13, color: COLORS.subtext }}>{label}</Text>
      <Text style={{ marginTop: 4, fontSize: 20, fontWeight: '800', color: COLORS.text }}>
        {value}
      </Text>
    </View>
  );
}
