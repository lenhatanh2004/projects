// app/(auth)/forgot_password.tsx
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card, Input, Label, Separator, Text, Theme, XStack, YStack } from 'tamagui';

import { forgotPassword, verifyOTP, resetPassword } from './../../server/users';

/* ================== VALIDATIONS ================== */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePasswordRules(pw: string, email?: string) {
  const errors: string[] = [];
  if (pw.length < 6) errors.push('Mật khẩu cần ít nhất 6 ký tự.');
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) errors.push('Mật khẩu cần kết hợp chữ hoa và chữ thường.');
  if (email) {
    const local = email.split('@')[0] || '';
    if (local && local.length >= 3 && pw.toLowerCase().includes(local.toLowerCase())) {
      errors.push('Mật khẩu không được chứa thông tin cá nhân (email).');
    }
  }
  return errors;
}

/* ================== ALERT HELPERS ================== */
const getApiMsg = (res: any, fallback: string) => res?.message || res?.data?.message || fallback;
const getErrMsg = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.data?.message || err?.message || fallback;

const showAlert = (title: string, msg: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    alert(`${title}: ${msg}`);
    onOk?.();
  } else {
    Alert.alert(title, msg, onOk ? [{ text: 'OK', onPress: onOk }] : [{ text: 'OK' }]);
  }
};
const showInfo = (msg: string, title = 'Thông báo') => showAlert(title, msg);
const showSuccess = (msg: string, title = 'Thành công') => showAlert(title, msg);
const showErr = (msg: string, title = 'Lỗi') => showAlert(title, msg);

/* ================== COMPONENT ================== */
export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  /* ================== STEP 1 ================== */
  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) return showErr('Vui lòng nhập email hợp lệ.');
    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] POST /forgotpassword', cleanEmail);
      const res = await forgotPassword(cleanEmail);
      const apiMsg = getApiMsg(res, 'Mã xác nhận đã được gửi tới email của bạn.');
      showSuccess(apiMsg, 'Đã gửi mã');
      setOtpVerified(false);
      setResendCountdown(60);
      setStep(2);
    } catch (err: any) {
      if (__DEV__) console.error('[ForgotPw] send code error:', err?.status, err?.data || err);
      showErr(String(getErrMsg(err, 'Không thể gửi mã. Vui lòng thử lại.')));
    } finally {
      setLoading(false);
    }
  };

  /* ================== STEP 2 ================== */
  const handleVerifyOTPOnly = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const otp = codeInput.trim();
    if (!isValidEmail(cleanEmail)) return showErr('Email không hợp lệ.');
    if (otp.length !== 6) return showErr('Nhập mã xác nhận 6 chữ số.');

    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] POST /verifyOTP', { email: cleanEmail, otp });
      const res = await verifyOTP({ email: cleanEmail, otp });
      const apiMsg = getApiMsg(res, 'Mã OTP hợp lệ. Vui lòng đặt mật khẩu mới.');
      showSuccess(apiMsg);
      setOtpVerified(true);
      setStep(3);
    } catch (err: any) {
      if (__DEV__) console.error('[ForgotPw] verify error:', err?.status, err?.data || err);
      showErr(String(getErrMsg(err, 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.')));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) return showErr('Email không hợp lệ.');
    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] resend OTP /forgotpassword', cleanEmail);
      const res = await forgotPassword(cleanEmail);
      showInfo(getApiMsg(res, 'Mã xác nhận đã được gửi lại.'), 'Đã gửi lại');
      setResendCountdown(60);
    } catch (err: any) {
      if (__DEV__) console.error('[ForgotPw] resend error:', err?.status, err?.data || err);
      showErr(String(getErrMsg(err, 'Không thể gửi lại mã.')));
    } finally {
      setLoading(false);
    }
  };

  /* ================== STEP 3 ================== */
  const handleResetPasswordOnly = async () => {
    if (!otpVerified) {
      showErr('Bạn cần xác thực OTP trước khi đặt mật khẩu.');
      setStep(2);
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const errs = validatePasswordRules(newPassword, cleanEmail);
    if (errs.length) return showErr(errs.join('\n'), 'Mật khẩu không hợp lệ');
    if (newPassword !== confirmPassword) return showErr('Mật khẩu xác nhận không khớp.');

    setLoading(true);
    try {
      const payload = { email: cleanEmail, password: newPassword, confirmPassword };
      if (__DEV__) console.log('[ForgotPw] POST /resetpassword', payload);
      const res = await resetPassword(payload);
      const apiMsg = getApiMsg(res, 'Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập.');
      showAlert('Thành công', apiMsg, () => {
        setStep(1);
        setEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setCodeInput('');
        setOtpVerified(false);
        router.replace('/(auth)/login');
      });
    } catch (err: any) {
      if (__DEV__) console.error('[ForgotPw] reset error:', err?.status, err?.data || err);
      showErr(String(getErrMsg(err, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.')));
    } finally {
      setLoading(false);
    }
  };

  /* ================== UI ================== */
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Theme name="light">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: '#9CD0E4' }}
          >
            <YStack style={{ alignItems: 'center', width: '100%' }}>
              <Card
                style={{
                  width: '92%',
                  maxWidth: 520,
                  paddingHorizontal: 18,
                  paddingVertical: 18,
                  borderRadius: 12,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.08)',
                  backgroundColor: '#fff',
                  padding:20
                }}
              >
                <YStack style={{ gap: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                    Quên mật khẩu
                  </Text>

                  {/* Step indicator */}
                  <XStack style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {/* Step 1 */}
                    <YStack style={{ alignItems: 'center' }}>
                      <Text
                        style={{
                          width: 32,
                          height: 32,
                          lineHeight: 32,
                          borderRadius: 16,
                          backgroundColor: step >= 1 ? '#085C9C' : '#0685e5ff',
                          color: 'white',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}
                      >
                        1
                      </Text>
                      {Platform.OS === 'web' && (
                        <Text style={{ fontSize: 10, color: '#585858', marginTop: 4 }}>Email</Text>
                      )}
                    </YStack>

                    <Separator style={{ width: 30 }} />

                    {/* Step 2 */}
                    <YStack style={{ alignItems: 'center' }}>
                      <Text
                        style={{
                          width: 32,
                          height: 32,
                          lineHeight: 32,
                          borderRadius: 16,
                          backgroundColor: step >= 2 ? '#085C9C' : '#0685e5ff',
                          color: 'white',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}
                      >
                        2
                      </Text>
                      {Platform.OS === 'web' && (
                        <Text style={{ fontSize: 10, color: '#585858', marginTop: 4 }}>OTP</Text>
                      )}
                    </YStack>

                    <Separator style={{ width: 30 }} />

                    {/* Step 3 */}
                    <YStack style={{ alignItems: 'center' }}>
                      <Text
                        style={{
                          width: 32,
                          height: 32,
                          lineHeight: 32,
                          borderRadius: 16,
                          backgroundColor: step >= 3 ? '#085C9C' : '#0685e5ff',
                          color: 'white',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}
                      >
                        3
                      </Text>
                      {Platform.OS === 'web' && (
                        <Text style={{ fontSize: 10, color: '#585858', marginTop: 4 }}>Mật khẩu</Text>
                      )}
                    </YStack>
                  </XStack>

                  {/* STEP 1 */}
                  {step === 1 && (
                    <YStack style={{ gap: 12 }}>
                      <YStack style={{ alignItems: 'center', paddingVertical: 12 }}>
                        <FontAwesome name="envelope" size={Platform.OS === 'web' ? 120 : 200} color="#085C9C" />
                      </YStack>

                      <Label style={{ fontSize: 14, fontWeight: '500', color: '#585858' }}>Email đăng ký</Label>

                      <XStack
                        style={{
                          alignItems: 'center',
                          height: 52,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: '#F8F8F8',
                          borderColor: '#E4E4E4',
                          paddingHorizontal: 12,
                        }}
                      >
                        <MaterialCommunityIcons name="email-outline" size={18} color="#8C8C8C" />
                        <Input
                          style={{
                            flex: 1,
                            height: 52,
                            borderWidth: 0,
                            backgroundColor: 'transparent',
                            marginLeft: 8,
                            fontSize:16
                          }}
                          placeholder="Nhập email của bạn"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </XStack>

                      <Button
                        style={{ height: 50, borderRadius: 10, backgroundColor: '#085C9C' }}
                        onPress={handleSendCode}
                        disabled={loading}
                      >
                        <Text style={{ fontSize: 14, color: 'white', fontWeight: '600' }}>
                          {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                        </Text>
                      </Button>

                      <Button
                        style={{
                          height: 44,
                          borderRadius: 10,
                          backgroundColor: 'transparent',
                          borderWidth: 1,
                          borderColor: '#E4E4E4',
                        }}
                        onPress={() => router.back()}
                      >
                        <Text style={{ fontSize: 13, color: '#085C9C', fontWeight: '600' }}>Quay lại đăng nhập</Text>
                      </Button>
                    </YStack>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <YStack style={{ gap: 12 }}>
                      <YStack style={{ alignItems: 'center', paddingVertical: 12 }}>
                        <FontAwesome name="key" size={Platform.OS === 'web' ? 120 : 200} color="#dc2626" />
                      </YStack>

                      <Label style={{ fontSize: 14, fontWeight: '500', color: '#585858' }}>
                        Nhập mã xác nhận (6 chữ số)
                      </Label>

                      <XStack
                        style={{
                          alignItems: 'center',
                          height: 52,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: '#F8F8F8',
                          borderColor: '#E4E4E4',
                          paddingHorizontal: 12,
                        }}
                      >
                        <MaterialCommunityIcons name="message-text-outline" size={18} color="#8C8C8C" />
                        <Input
                          style={{
                            flex: 1,
                            height: 52,
                            borderWidth: 0,
                            backgroundColor: 'transparent',
                            marginLeft: 8,
                            fontSize:18
                          }}
                          placeholder="123456"
                          value={codeInput}
                          onChangeText={(t) => setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 6))}
                          keyboardType="numeric"
                        />
                      </XStack>

                      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, color: '#666' }}>Mã được gửi tới: {email}</Text>
                        <Button
                          style={{
                            height: 36,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: resendCountdown > 0 ? '#F1F1F1' : '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#E4E4E4',
                          }}
                          onPress={handleResendCode}
                          disabled={resendCountdown > 0 || loading}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              color: resendCountdown > 0 ? '#8C8C8C' : '#085C9C',
                              fontWeight: '600',
                            }}
                          >
                            {resendCountdown > 0 ? `${resendCountdown}s` : 'Gửi lại'}
                          </Text>
                        </Button>
                      </XStack>

                      <XStack style={{ gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Button
                          style={{ height: 48, flex: 1, borderRadius: 10, backgroundColor: '#E6EEF6' }}
                          onPress={() => setStep(1)}
                          disabled={loading}
                        >
                          <Text style={{ color: '#085C9C', fontWeight: '600' }}>Quay lại</Text>
                        </Button>

                        <Button
                          style={{ height: 48, flex: 1, borderRadius: 10, backgroundColor: '#085C9C' }}
                          onPress={handleVerifyOTPOnly}
                          disabled={loading || codeInput.length !== 6}
                        >
                          <Text style={{ color: 'white', fontWeight: '600' }}>
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                          </Text>
                        </Button>
                      </XStack>
                    </YStack>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <YStack style={{ gap: 12 }}>
                      <YStack style={{ alignItems: 'center', paddingVertical: 12 }}>
                        <FontAwesome name="lock" size={Platform.OS === 'web' ? 120 : 200} color="#f59e0b" />
                      </YStack>

                      <Label style={{ fontSize: 14, fontWeight: '500', color: '#585858' }}>Mật khẩu mới</Label>

                      <XStack
                        style={{
                          alignItems: 'center',
                          height: 52,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: '#F8F8F8',
                          borderColor: '#E4E4E4',
                          paddingHorizontal: 12,
                        }}
                      >
                        <MaterialCommunityIcons name="lock-outline" size={18} color="#8C8C8C" />
                        <Input
                          style={{
                            flex: 1,
                            height: 52,
                            borderWidth: 0,
                            backgroundColor: 'transparent',
                            marginLeft: 8,
                            fontSize:16
                          }}
                          placeholder="Nhập mật khẩu mới"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showPw}
                        />
                        <Button style={{ backgroundColor: 'transparent', height: 36, width: 36, padding: 0 }}
                          onPress={() => setShowPw((s) => !s)}
                        >
                          <MaterialCommunityIcons
                            name={showPw ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#8C8C8C"
                          />
                        </Button>
                      </XStack>

                      <Label style={{ fontSize: 14, fontWeight: '500', color: '#585858' }}>
                        Xác nhận mật khẩu
                      </Label>

                      <XStack
                        style={{
                          alignItems: 'center',
                          height: 52,
                          borderRadius: 10,
                          borderWidth: 1,
                          backgroundColor: '#F8F8F8',
                          borderColor: '#E4E4E4',
                          paddingHorizontal: 12,
                        }}
                      >
                        <MaterialCommunityIcons name="lock-check-outline" size={18} color="#8C8C8C" />
                        <Input
                          style={{
                            flex: 1,
                            height: 52,
                            borderWidth: 0,
                            backgroundColor: 'transparent',
                            marginLeft: 8,
                            fontSize:16
                          }}
                          placeholder="Nhập lại mật khẩu"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
                        />
                      </XStack>

                      <Text style={{ fontSize: 12, color: '#666', lineHeight: 16 }}>
                        • Tối thiểu 6 ký tự{'\n'}• Có chữ hoa và chữ thường{'\n'}• Không chứa thông tin cá nhân
                      </Text>

                      <XStack style={{ gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                        <Button
                          style={{ height: 48, flex: 1, borderRadius: 10, backgroundColor: '#E6EEF6' }}
                          onPress={() => setStep(2)}
                          disabled={loading}
                        >
                          <Text style={{ color: '#085C9C', fontWeight: '600' }}>Quay lại</Text>
                        </Button>

                        <Button
                          style={{ height: 48, flex: 1, borderRadius: 10, backgroundColor: '#085C9C' }}
                          onPress={handleResetPasswordOnly}
                          disabled={loading || !newPassword || !confirmPassword}
                        >
                          <Text style={{ color: 'white', fontWeight: '600' }}>
                            {loading ? 'Đang xử lý...' : 'Hoàn tất'}
                          </Text>
                        </Button>
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </Card>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </Theme>
    </>
  );
}
