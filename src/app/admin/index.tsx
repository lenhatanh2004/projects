import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  primarySoft: '#EEF4FF',
  badgeDark: '#0F172A',
};

export default function AdminHome() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Bảng điều khiển quản trị viên', headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header Card */}
        <View style={{ margin: 16, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ flexDirection: 'row', padding: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EDF2F7', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontWeight: '800', color: COLORS.text }}>NV</Text>
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Xin chào, Nguyễn Văn A</Text>
              <Text style={{ marginTop: 2, color: COLORS.subtext }}>admin@example.com</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: COLORS.badgeDark, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 }}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Quản trị viên</Text>
              </View>
            </View>
          </View>

          {/* Menu cá nhân */}
          {[
            { icon: 'person-circle-outline', label: 'Thông tin cá nhân' },
            { icon: 'settings-outline', label: 'Cài đặt' },
            { icon: 'log-out-outline', label: 'Đăng xuất' },
          ].map((item, idx) => (
            <View key={item.label} style={{
              marginHorizontal: 12,
              marginTop: idx === 0 ? 0 : 10,
              borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#FFF'
            }}>
              <TouchableOpacity activeOpacity={0.9} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={item.icon as any} size={20} color={COLORS.text} />
                  <Text style={{ marginLeft: 10, color: COLORS.text, fontWeight: '700' }}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 16 }} />
        </View>

        {/* Dải điều hướng quản trị */}
        <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.text} />
          <Text style={{ marginLeft: 8, fontWeight: '800', color: COLORS.text }}>Bảng điều khiển quản trị viên</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('../admin/dashboard')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: COLORS.badgeDark, paddingVertical: 12, paddingHorizontal: 14,
              borderRadius: 12
            }}
          >
            <MaterialCommunityIcons name="view-dashboard-outline" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '800' }}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('../admin/users')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: COLORS.primarySoft, paddingVertical: 12, paddingHorizontal: 14,
              borderRadius: 12, borderWidth: 1, borderColor: COLORS.border
            }}
          >
            <Ionicons name="people-outline" size={18} color={COLORS.text} />
            <Text style={{ color: COLORS.text, fontWeight: '800' }}>Quản lý tài khoản</Text>
          </TouchableOpacity>
        </View>

        {/* Vùng nội dung chờ chọn */}
        <View style={{
          margin: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
          padding: 24, alignItems: 'center'
        }}>
          <Text style={{ color: COLORS.subtext }}>Chọn một tùy chọn quản trị ở trên để bắt đầu</Text>
        </View>
      </ScrollView>
    </>
  );
}
