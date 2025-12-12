// app/(auth)/register.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, Stack, useRouter } from 'expo-router';
import { View, Alert, Image } from 'react-native';
import React, { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  ScrollView,
  Separator,
  Text,
  Theme,
  XStack,
  YStack,
  Spinner,
} from 'tamagui';

import { register as apiRegister } from './../../server/users';
import { Check } from '@tamagui/lucide-icons';

// Logo app
const Logo = require('../../assets/images/FlowState.png');

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // State cho ngày sinh (dạng chuỗi DD/MM/YYYY để hiển thị)
  const [dobText, setDobText] = useState('');
  
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [address, setAddress] = useState('');

  // Hàm xử lý nhập ngày sinh: tự động thêm dấu /
  const handleDobChange = (text: string) => {
    // Chỉ cho phép nhập số
    let cleaned = text.replace(/[^0-9]/g, '');

    // Giới hạn tối đa 8 số (ddmmyyyy)
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);

    // Format: DD/MM/YYYY
    let formatted = cleaned;
    if (cleaned.length >= 3 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    }

    setDobText(formatted);
  };

  // Hàm chuyển đổi chuỗi DD/MM/YYYY sang Date object (ISO format)
  // Trả về null nếu ngày không hợp lệ
  const parseDobToDate = (text: string): Date | null => {
    // Regex kiểm tra sơ bộ định dạng d/m/y
    const parts = text.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (!day || !month || !year) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > new Date().getFullYear()) return null;

    // Tạo đối tượng Date (Lưu ý: tháng trong JS bắt đầu từ 0)
    const dateObj = new Date(year, month - 1, day);
    
    // Kiểm tra lại xem ngày có hợp lệ không (ví dụ: 31/02 sẽ tự nhảy sang tháng 3)
    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      return null;
    }

    return dateObj;
  };

  const formatDateIso = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const validate = () => {
    if (__DEV__) console.log('[Register] Validating form...');
    if (!fullName.trim()) return 'Vui lòng nhập họ và tên';
    if (!email.trim()) return 'Vui lòng nhập email';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return 'Email không hợp lệ';
    if (!phone.trim()) return 'Vui lòng nhập số điện thoại';
    
    // Validate ngày sinh
    if (!dobText) return 'Vui lòng nhập ngày sinh';
    const dobDate = parseDobToDate(dobText);
    if (!dobDate) return 'Ngày sinh không hợp lệ (DD/MM/YYYY)';

    if (!gender) return 'Vui lòng chọn giới tính';
    if (!address.trim()) return 'Vui lòng nhập địa chỉ';

    if (pw.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    if (pw !== confirmPw) return 'Mật khẩu xác nhận không khớp';
    if (!agree) return 'Bạn cần đồng ý với điều khoản để tiếp tục';
    
    return '';
  };

  const onRegister = async () => {
    const msg = validate();
    if (msg) {
      Alert.alert('Thiếu thông tin', msg);
      return;
    }

    const dobDate = parseDobToDate(dobText); // Chắc chắn có giá trị vì đã validate

    const payload = {
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: pw,
      confirmPassword: confirmPw,
      dateOfBirth: formatDateIso(dobDate!),
      gender,
      address: address.trim(),
    };

    setLoading(true);
    try {
      const res = await apiRegister(payload);
      const apiMessage = res?.message || res?.data?.message || 'Tạo tài khoản thành công.';
      Alert.alert('Đăng ký thành công', apiMessage);
      router.replace("/(auth)/login");
    } catch (err: any) {
      const e = err?.data?.message || err?.response?.data?.message || err?.message || 'Đăng ký thất bại.';
      Alert.alert('Đăng ký thất bại', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Theme name="light">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          backgroundColor="#9CD0E4"
        >
          <Image source={Logo} style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 24 }} />

          <Card width="90%" maxWidth={420} paddingHorizontal={20} paddingVertical={20} borderRadius={16} elevation={2} bordered>
            <YStack>
              <Text fontSize={24} fontWeight="600" marginBottom={4}>
                Tạo tài khoản mới
              </Text>
              <Text fontSize={13} color="#585858" marginBottom={16}>
                Tham gia cùng <Text fontWeight="700">FlowState</Text> ngay hôm nay
              </Text>

              {/* Full name */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Họ và tên</Label>
              <XStack alignItems="center" height={56} borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16}>
                <MaterialCommunityIcons name="account-outline" size={18} color="#8C8C8C" />
                <Input flex={1} height={56} fontSize={16} placeholder="Nhập họ và tên" value={fullName} onChangeText={setFullName} autoCapitalize="words" backgroundColor="transparent" borderWidth={0} marginLeft={8} />
              </XStack>

              {/* Email */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Email</Label>
              <XStack alignItems="center" height={56} borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#8C8C8C" />
                <Input flex={1} height={56} fontSize={16} placeholder="Nhập email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" backgroundColor="transparent" borderWidth={0} marginLeft={8} />
              </XStack>

              {/* Phone */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Số điện thoại</Label>
              <XStack alignItems="center" height={56} borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16}>
                <MaterialCommunityIcons name="phone-outline" size={18} color="#8C8C8C" />
                <Input flex={1} height={56} fontSize={16} placeholder="Nhập số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" backgroundColor="transparent" borderWidth={0} marginLeft={8} />
              </XStack>

              {/* Date of birth - NHẬP TAY DD/MM/YYYY */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Ngày sinh</Label>
              <XStack alignItems="center" height={56} borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16}>
                <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#8C8C8C" />
                <Input
                  flex={1}
                  height={56}
                  fontSize={16}
                  placeholder="DD/MM/YYYY (Ví dụ: 25/12/2000)"
                  value={dobText}
                  onChangeText={handleDobChange}
                  keyboardType="numeric" // Chỉ hiện bàn phím số trên điện thoại
                  backgroundColor="transparent"
                  borderWidth={0}
                  marginLeft={8}
                  maxLength={10} // Giới hạn độ dài chuỗi
                />
              </XStack>

              {/* Gender */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Giới tính</Label>
              <XStack space="$2" marginBottom={16}>
                <Button flex={1} height={42} borderRadius={999} backgroundColor={gender === 'male' ? '#085C9C' : '#F0F0F0'} onPress={() => setGender('male')}>
                  <Text color={gender === 'male' ? 'white' : '#333'} fontWeight="600">Nam</Text>
                </Button>
                <Button flex={1} height={42} borderRadius={999} backgroundColor={gender === 'female' ? '#085C9C' : '#F0F0F0'} onPress={() => setGender('female')}>
                  <Text color={gender === 'female' ? 'white' : '#333'} fontWeight="600">Nữ</Text>
                </Button>
              </XStack>

              {/* Address */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Địa chỉ</Label>
              <XStack alignItems="center" borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color="#8C8C8C" />
                <Input flex={1} height={56} fontSize={16} placeholder="Nhập địa chỉ" value={address} onChangeText={setAddress} backgroundColor="transparent" borderWidth={0} marginLeft={8} multiline />
              </XStack>

              {/* Passwords */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Mật khẩu</Label>
              <Input height={56} fontSize={16} placeholder="Nhập mật khẩu" secureTextEntry value={pw} onChangeText={setPw} borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16} />
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>Xác nhận mật khẩu</Label>
              <Input height={56} fontSize={16} placeholder="Nhập lại mật khẩu" secureTextEntry value={confirmPw} onChangeText={setConfirmPw} borderRadius={12} borderWidth={1} backgroundColor="#F8F8F8" borderColor="#E4E4E4" paddingHorizontal={12} marginBottom={16} />

              {/* Agree terms */}
              <XStack alignItems="center" marginBottom={20} space="$3">
                <Checkbox id="agree" size="$3" checked={agree} onCheckedChange={(val) => setAgree(!!val)} backgroundColor={agree ? '#085C9C' : '#FFFFFF'} borderColor={agree ? '#085C9C' : '#E4E4E4'} borderWidth={1} borderRadius={6}>
                  <Checkbox.Indicator><Check size={14} color="#FFFFFF" strokeWidth={3} /></Checkbox.Indicator>
                </Checkbox>
                <Label htmlFor="agree" fontSize={13} color="#585858" onPress={() => setAgree((v) => !v)}>
                  Tôi đồng ý với <Text style={{ color: '#085C9C' }}>Điều khoản</Text> & <Text style={{ color: '#085C9C' }}>Chính sách bảo mật</Text>
                </Label>
              </XStack>

              {/* Register Button */}
              <Button height={56} borderRadius={12} backgroundColor="#085C9C" onPress={onRegister} disabled={loading}>
                <XStack alignItems="center" justifyContent="center" space={8}>
                  {loading ? <Spinner size="small" /> : null}
                  <Text fontSize={16} fontWeight="600" color="white">{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</Text>
                </XStack>
              </Button>

              <XStack alignItems="center" marginVertical={12}>
                <Separator flex={1} backgroundColor="#E0E6EE" />
                <Text fontSize={12} color="#585858" style={{ marginHorizontal: 12 }}>Hoặc</Text>
                <Separator flex={1} backgroundColor="#E0E6EE" />
              </XStack>

              <Text textAlign="center" marginTop={12} color="#585858" fontSize={14}>
                Đã có tài khoản? <Link href="/(auth)/login" asChild><Text fontWeight="600" color="#085C9C">Đăng nhập</Text></Link>
              </Text>
            </YStack>
          </Card>
        </ScrollView>
      </Theme>
    </>
  );
}