// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  getProfile,
  getUserById,
  updateProfile,
  updateAdditionalInfo,
  logout as apiLogout,
} from '../../../server/users';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
};

type Role = 'admin' | 'user';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: Role;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
};

function parseDateString(input?: string | null): Date | null {
  if (!input) return null;
  const d = new Date(input);
  if (isNaN(d.getTime())) return null;
  return d;
}

function formatDateIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateDMY(d: Date | null): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // card “Thông tin cá nhân”
  const [summary, setSummary] = useState<UserProfile | null>(null);

  // form “Cập nhật thông tin”
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [address, setAddress] = useState('');
  const [showUpdateSection, setShowUpdateSection] = useState(true);

  const [showInfoSection, setShowInfoSection] = useState(true);
  const isAdmin = summary?.role === 'admin';

  const loadProfile = async () => {
    try {
      setLoading(true);

      // 1. /me để lấy id + role
      const meRes = await getProfile();
      const me = meRes?.user || meRes?.data?.user || meRes?.data || meRes;
      const userId = me.id || me._id;
      if (!userId) throw new Error('Không tìm được ID người dùng từ /me');

      // 2. /api/users/:id lấy full profile (DOB, gender, address...)
      const profileRes = await getUserById(userId);
      const p = profileRes?.data || profileRes?.user || profileRes;

      const normalized: UserProfile = {
        id: p.id || p._id || userId,
        name: p.name,
        email: p.email,
        phone: p.phone,
        role: p.role || me.role || 'user',
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        address: p.address,
      };

      setUser(normalized);
      setSummary(normalized);

      // đổ data vào form
      setName(normalized.name || '');
      setEmail(normalized.email || '');
      setPhone(normalized.phone || '');
      setDob(parseDateString(normalized.dateOfBirth));
      setAddress(normalized.address || '');

      const g = (normalized.gender || '').toLowerCase();
      if (g === 'male' || g === 'female') {
        setGender(g);
      } else {
        setGender(null);
      }
    } catch (err: any) {
      console.log('[loadProfile] error', err?.message || err);
      Alert.alert('Lỗi', err?.message || 'Không thể tải hồ sơ người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSave = async () => {
    if (!user) return;

    if (!name.trim() || !email.trim()) {
      Alert.alert('Lỗi', 'Tên và email không được để trống');
      return;
    }

    if (!dob) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày sinh');
      return;
    }

    if (!gender) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính');
      return;
    }

    const dobIso = formatDateIso(dob);

    try {
      setSaving(true);

      // Use updateProfile which supports all fields
      await updateProfile(user.id, {
        name,
        email,
        phone,
        dateOfBirth: dobIso,
        gender,
        address,
      });

      // 3. load lại profile từ BE
      await loadProfile();

      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
    } catch (err: any) {
      console.log('[onSave] error', err?.message || err);
      Alert.alert('Lỗi', err?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch { }
    router.replace('/(auth)/login');
  };

  if (loading || !summary) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.background,
          }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: COLORS.subtext }}>Đang tải hồ sơ...</Text>
        </SafeAreaView>
      </>
    );
  }

  const genderLabel =
    summary.gender === 'male'
      ? 'Nam'
      : summary.gender === 'female'
        ? 'Nữ'
        : '—';

  const dobLabel = parseDateString(summary.dateOfBirth);

  const initials =
    summary.name
      ?.split(' ')
      .map((s: string) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {/* CARD THÔNG TIN CƠ BẢN */}
            <View
              style={{
                margin: 16,
                backgroundColor: COLORS.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#EDF2F7',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontWeight: '800', fontSize: 20, color: COLORS.text }}>{initials}</Text>
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>
                    Xin chào, {summary.name}
                  </Text>
                  <Text style={{ color: COLORS.subtext, marginTop: 2 }}>{summary.email}</Text>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 8,
                      backgroundColor: isAdmin ? '#0F172A' : COLORS.primary,
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>
                      {isAdmin ? 'Quản trị viên' : 'Người dùng'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* MENU DÀNH CHO ADMIN */}
            {isAdmin && (
              <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
                {/* Dashboard */}
                <TouchableOpacity
                  onPress={() => router.push('/admin/dashboard')}
                  style={{
                    marginTop: 4,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="speedometer-outline" size={20} color={COLORS.text} />
                    <Text style={{ marginLeft: 10, fontWeight: '700', color: COLORS.text }}>
                      Dashboard
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color={COLORS.subtext} />
                </TouchableOpacity>

                {/* Quản lý tài khoản */}
                <TouchableOpacity
                  onPress={() => router.push('/admin/users')}
                  style={{
                    marginTop: 8,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={20} color={COLORS.text} />
                    <Text style={{ marginLeft: 10, fontWeight: '700', color: COLORS.text }}>
                      Quản lý tài khoản
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={18} color={COLORS.subtext} />
                </TouchableOpacity>
              </View>
            )}

            {/* TÚI VẬT PHẨM – dùng chung cho cả admin & user */}
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/profile/item')} // nếu file của bạn là app/(tabs)/items/index.tsx thì đổi thành '/(tabs)/items'
                style={{
                  marginTop: 4,
                  backgroundColor: COLORS.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="gift-outline" size={20} color={COLORS.text} />
                  <Text style={{ marginLeft: 10, fontWeight: '700', color: COLORS.text }}>
                    Túi vật phẩm
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            {/* FORM CẬP NHẬT */}
            <TouchableOpacity
              onPress={() => setShowUpdateSection(prev => !prev)}
              style={{
                marginHorizontal: 16,
                marginTop: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: '#FFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ fontWeight: '800', color: COLORS.text }}>Thông tin cá nhân</Text>
                <Text style={{ fontSize: 12, color: COLORS.subtext }}>
                  Nhấn để {showUpdateSection ? 'thu gọn' : 'mở rộng'}
                </Text>
              </View>
              <Ionicons
                name={showUpdateSection ? 'chevron-down-outline' : 'chevron-forward-outline'}
                size={18}
                color={COLORS.subtext}
              />
            </TouchableOpacity>

            {showUpdateSection && (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 8,
                  backgroundColor: COLORS.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  padding: 16,
                }}
              >
                <Field label="Họ và tên">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Nhập họ và tên"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Email">
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Nhập email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Số điện thoại">
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Ngày sinh">
                  <TouchableOpacity onPress={() => setShowDobPicker(true)}>
                    <View style={[inputStyle, { justifyContent: 'center' }]}>
                      <Text style={{ color: dob ? COLORS.text : COLORS.subtext }}>
                        {dob ? formatDateDMY(dob) : 'Chọn ngày sinh'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Field>

                {showDobPicker && (
                  <DateTimePicker
                    value={dob || new Date(2004, 1, 3)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDobPicker(false);
                      if (selectedDate) {
                        setDob(selectedDate);
                        if (__DEV__) console.log('[Profile] dob picked:', selectedDate);
                      }
                    }}
                  />
                )}


                <Field label="Giới tính">
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([
                      { value: 'male', label: 'Nam' },
                      { value: 'female', label: 'Nữ' },
                    ] as const).map(opt => (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setGender(opt.value)}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: COLORS.border,
                          borderRadius: 999,
                          paddingVertical: 8,
                          alignItems: 'center',
                          backgroundColor: gender === opt.value ? COLORS.primary : '#FFF',
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            color: gender === opt.value ? '#FFF' : COLORS.text,
                          }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Field>

                <Field label="Địa chỉ">
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Nhập địa chỉ"
                    style={[inputStyle, { height: 70, textAlignVertical: 'top' }]}
                    multiline
                  />
                </Field>

                <TouchableOpacity
                  onPress={onSave}
                  disabled={saving}
                  style={{
                    marginTop: 12,
                    backgroundColor: COLORS.primary,
                    borderRadius: 999,
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>Lưu thay đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ĐĂNG XUẤT */}
            <View style={{ marginHorizontal: 16, marginTop: 24 }}>
              <TouchableOpacity
                onPress={onLogout}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  backgroundColor: '#FFF',
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                  <Text style={{ marginLeft: 10, color: COLORS.danger, fontWeight: '700' }}>
                    Đăng xuất
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ marginBottom: 4, color: COLORS.subtext, fontWeight: '600' }}>{props.label}</Text>
      {props.children}
    </View>
  );
}

function InfoRow(props: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontSize: 12, color: COLORS.subtext }}>{props.label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>{props.value}</Text>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 8,
  backgroundColor: '#FFF',
};