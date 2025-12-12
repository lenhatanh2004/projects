// src/app/admin/users.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getAllUsers,
  updateProfile,
  deleteUser,
  adminCreateUser,
} from '../../server/users';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
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

function formatDateDMYFromString(input?: string | null): string {
  const d = parseDateString(input);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateDMY(d: Date | null): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

type Role = 'admin' | 'user';
type Gender = 'male' | 'female';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // edit modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editingDob, setEditingDob] = useState<Date | null>(null);
  const [editingGender, setEditingGender] = useState<Gender | null>(null);
  const [editingAddress, setEditingAddress] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingConfirmPassword, setEditingConfirmPassword] = useState('');


  // create form
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newDob, setNewDob] = useState<Date | null>(null);
  const [showNewDobPicker, setShowNewDobPicker] = useState(false);
  const [newGender, setNewGender] = useState<Gender | null>(null);
  const [newAddress, setNewAddress] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers({ page: 1, limit: 100 });
      const data = res?.data || res;
      const list = data.users || data.data?.users || [];
      setUsers(list);
    } catch (e) {
      console.log('loadUsers error', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const keyword = search.toLowerCase();
    return users.filter((u) => {
      return (
        u.name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword) ||
        u.phone?.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const openEdit = (u: any) => {
    setEditingUser(u);
    setEditingName(u.name || '');
    setEditingEmail(u.email || '');
    setEditingPhone(u.phone || '');
    setEditingDob(parseDateString(u.dateOfBirth));
    setEditingAddress(u.address || '');
    setEditingPassword('');
    setEditingConfirmPassword('');
    const g = (u.gender || '').toLowerCase();
    if (g === 'male' || g === 'female' || g === 'other') {
      setEditingGender(g);
    } else {
      setEditingGender(null);
    }
  };

    const onSaveEdit = async () => {
    if (!editingUser) return;

    // chỉ validate tên và mật khẩu
    if (!editingName.trim()) {
      Alert.alert('Lỗi', 'Tên tài khoản không được để trống');
      return;
    }

    if (!editingPassword || !editingConfirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới và xác nhận mật khẩu');
      return;
    }

    if (editingPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    if (editingPassword !== editingConfirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      const id = editingUser._id || editingUser.id;

      await updateProfile(id, {
        name: editingName.trim(),
        password: editingPassword,
        confirmPassword: editingConfirmPassword,
      });

      Alert.alert('Thành công', 'Cập nhật tài khoản thành công');
      setEditingUser(null);
      await loadUsers();
    } catch (e: any) {
      console.log('onSaveEdit error', e?.message || e);
      Alert.alert('Lỗi', e?.message || 'Cập nhật tài khoản thất bại');
    }
  };


  const onDeleteUser = async (u: any) => {
    const id = u._id || u.id;
    Alert.alert('Xoá tài khoản', `Bạn chắc chắn muốn xoá tài khoản ${u.email}?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(id);
            Alert.alert('Thành công', 'Xoá tài khoản thành công');
            await loadUsers();
          } catch (e: any) {
            console.log('onDeleteUser error', e?.message || e);
            Alert.alert('Lỗi', e?.message || 'Xoá tài khoản thất bại');
          }
        },
      },
    ]);
  };

  const onCreateUser = async () => {
    if (!newName || !newEmail || !newPhone || !newPassword || !newConfirmPassword || !newAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!newDob) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày sinh');
      return;
    }
    if (!newGender) {
      Alert.alert('Lỗi', 'Vui lòng chọn giới tính');
      return;
    }

    const dobIso = formatDateIso(newDob);
    
    try {
      setCreating(true);
      await adminCreateUser({
        name: newName,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        confirmPassword: newConfirmPassword,
        role: 'user',
        dateOfBirth: dobIso,
        gender: newGender,
        address: newAddress.trim(),
      });

      Alert.alert('Thành công', 'Tạo tài khoản mới thành công');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewDob(null);
      setNewGender(null);
      setNewAddress('');

      await loadUsers();
    } catch (e: any) {
      console.log('onCreateUser error', e?.message || e);
      Alert.alert('Lỗi', e?.message || 'Tạo tài khoản thất bại');
    } finally {
      setCreating(false);
    }
  };

  const renderGenderLabel = (g?: string) => {
    if (!g) return '—';
    const lower = g.toLowerCase();
    if (lower === 'male') return 'Nam';
    if (lower === 'female') return 'Nữ';
    return '—';
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Quản lý tài khoản', headerShown: true }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: COLORS.subtext }}>Đang tải danh sách...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Search */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons name="search-outline" size={18} color={COLORS.subtext} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo tên, email, số điện thoại..."
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>

            {/* Form thêm tài khoản */}
            <View
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontWeight: '800', marginBottom: 8 }}>Thêm tài khoản mới</Text>

              <Field label="Họ tên">
                <TextInput style={inputStyle} value={newName} onChangeText={setNewName} />
              </Field>
              <Field label="Email">
                <TextInput
                  style={inputStyle}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Field>
              <Field label="Số điện thoại">
                <TextInput
                  style={inputStyle}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
              </Field>
              <Field label="Ngày sinh">
                <TouchableOpacity onPress={() => setShowNewDobPicker(true)}>
                  <View style={[inputStyle, { justifyContent: 'center' }]}>
                    <Text style={{ color: newDob ? COLORS.text : COLORS.subtext }}>
                      {newDob ? formatDateDMY(newDob) : 'Chọn ngày sinh'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Field>

              {showNewDobPicker && (
                <DateTimePicker
                  value={newDob || new Date(2004, 1, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowNewDobPicker(false);
                    if (selectedDate) setNewDob(selectedDate);
                  }}
                />
              )}
              <Field label="Giới tính">
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {([
                    { value: 'male' as Gender, label: 'Nam' },
                    { value: 'female' as Gender, label: 'Nữ' },
                  ] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setNewGender(opt.value)}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        borderRadius: 999,
                        paddingVertical: 8,
                        alignItems: 'center',
                        backgroundColor: newGender === opt.value ? COLORS.primary : '#FFF',
                      }}
                    >
                      <Text
                        style={{
                          color: newGender === opt.value ? '#FFF' : COLORS.text,
                          fontWeight: '700',
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
                  style={[inputStyle, { height: 70, textAlignVertical: 'top' }]}
                  value={newAddress}
                  onChangeText={setNewAddress}
                  placeholder="Nhập địa chỉ"
                  multiline
                />
              </Field>

              <Field label="Mật khẩu">
                <TextInput
                  style={inputStyle}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </Field>
              <Field label="Xác nhận mật khẩu">
                <TextInput
                  style={inputStyle}
                  value={newConfirmPassword}
                  onChangeText={setNewConfirmPassword}
                  secureTextEntry
                />
              </Field>

              <TouchableOpacity
                onPress={onCreateUser}
                disabled={creating}
                style={{
                  marginTop: 10,
                  backgroundColor: COLORS.primary,
                  borderRadius: 999,
                  paddingVertical: 10,
                  alignItems: 'center',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Tạo tài khoản</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Danh sách tài khoản */}
            {filteredUsers.map((u) => {
              const id = u._id || u.id;
              return (
                <View
                  key={id}
                  style={{
                    marginBottom: 10,
                    backgroundColor: COLORS.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    padding: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: COLORS.text }}>{u.name}</Text>
                      <Text style={{ color: COLORS.subtext, fontSize: 12 }}>{u.email}</Text>
                      {u.phone && (
                        <Text style={{ color: COLORS.subtext, fontSize: 12 }}>{u.phone}</Text>
                      )}
                      <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                        Ngày sinh: {formatDateDMYFromString(u.dateOfBirth) || '—'}
                      </Text>
                      <Text style={{ color: COLORS.subtext, fontSize: 12 }}>
                        Giới tính: {renderGenderLabel(u.gender)}
                      </Text>
                      <Text style={{ marginTop: 4, fontSize: 12 }}>
                        Vai trò:{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </Text>
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <TouchableOpacity
                        onPress={() => openEdit(u)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                      >
                        <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                        <Text
                          style={{
                            marginLeft: 4,
                            color: COLORS.primary,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          Sửa
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => onDeleteUser(u)}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                        <Text
                          style={{
                            marginLeft: 4,
                            color: COLORS.danger,
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          Xoá
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}

            {filteredUsers.length === 0 && (
              <Text style={{ textAlign: 'center', color: COLORS.subtext, marginTop: 12 }}>
                Không tìm thấy tài khoản nào
              </Text>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Modal sửa tài khoản */}
      <Modal visible={!!editingUser} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFF',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 8 }}>
              Chỉnh sửa tài khoản
            </Text>

            <Field label="Họ tên">
              <TextInput style={inputStyle} value={editingName} onChangeText={setEditingName} />
            </Field>
                        <Field label="Mật khẩu mới">
              <TextInput
                style={inputStyle}
                value={editingPassword}
                onChangeText={setEditingPassword}
                secureTextEntry
                placeholder="Nhập mật khẩu mới"
              />
            </Field>

            <Field label="Xác nhận mật khẩu mới">
              <TextInput
                style={inputStyle}
                value={editingConfirmPassword}
                onChangeText={setEditingConfirmPassword}
                secureTextEntry
                placeholder="Nhập lại mật khẩu mới"
              />
            </Field>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setEditingUser(null)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: '#FFF',
                }}
              >
                <Text>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSaveEdit}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: COLORS.primary,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ marginBottom: 4, color: COLORS.subtext, fontWeight: '600' }}>
        {props.label}
      </Text>
      {props.children}
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
