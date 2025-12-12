import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Toast from 'react-native-toast-message';

// Animated Wrapper Component - Slide from RIGHT to LEFT
const SlideInToast = ({ children }) => {
  const translateX = useRef(new Animated.Value(500)).current; // Bắt đầu từ ngoài màn hình bên PHẢI

  useEffect(() => {
    // Slide vào từ phải sang trái
    Animated.spring(translateX, {
      toValue: 0,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Sau 15 giây, slide ra bên phải
    const hideTimer = setTimeout(() => {
      Animated.timing(translateX, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 1500);

    return () => clearTimeout(hideTimer);
  }, [translateX]);

  return (
    <Animated.View style={{ transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
};

// Custom Toast Components
const ErrorToast = ({ text1, text2 }) => (
  <SlideInToast>
    <View style={[styles.toastContainer, styles.errorContainer]}>
      <View style={[styles.iconContainer, styles.errorIconBg]}>
        <Text style={styles.iconText}>✕</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  </SlideInToast>
);

const SuccessToast = ({ text1, text2 }) => (
  <SlideInToast>
    <View style={[styles.toastContainer, styles.successContainer]}>
      <View style={[styles.iconContainer, styles.successIconBg]}>
        <Text style={styles.iconText}>✓</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  </SlideInToast>
);

const WarningToast = ({ text1, text2 }) => (
  <SlideInToast>
    <View style={[styles.toastContainer, styles.warningContainer]}>
      <View style={[styles.iconContainer, styles.warningIconBg]}>
        <Text style={styles.iconText}>⚠</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  </SlideInToast>
);

const InfoToast = ({ text1, text2 }) => (
  <SlideInToast>
    <View style={[styles.toastContainer, styles.infoContainer]}>
      <View style={[styles.iconContainer, styles.infoIconBg]}>
        <Text style={styles.iconText}>ℹ</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{text1}</Text>
        {text2 && <Text style={styles.message}>{text2}</Text>}
      </View>
    </View>
  </SlideInToast>
);

// Toast Config
export const toastConfig = {
  error: (props) => <ErrorToast {...props} />,
  success: (props) => <SuccessToast {...props} />,
  warning: (props) => <WarningToast {...props} />,
  info: (props) => <InfoToast {...props} />,
};

// Helper functions
export const showErrorToast = (title, message) => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 15000,
    topOffset: 50,
    autoHide: true,
  });
};

export const showSuccessToast = (title, message) => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 15000,
    topOffset: 50,
    autoHide: true,
  });
};

export const showWarningToast = (title, message) => {
  Toast.show({
    type: 'warning',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 15000,
    topOffset: 50,
    autoHide: true,
  });
};

export const showInfoToast = (title, message) => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 15000,
    topOffset: 50,
    autoHide: true,
  });
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
  },
  successContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  warningContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
  },
  infoContainer: {
    borderLeftWidth: 5,
    borderLeftColor: '#3B82F6',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errorIconBg: {
    backgroundColor: '#FEE2E2',
  },
  successIconBg: {
    backgroundColor: '#D1FAE5',
  },
  warningIconBg: {
    backgroundColor: '#FEF3C7',
  },
  infoIconBg: {
    backgroundColor: '#DBEAFE',
  },
  iconText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

// === CÁCH SỬ DỤNG ===

/*
// 1. Cài đặt thư viện:
npm install react-native-toast-message

// 2. Trong App.js, thêm Toast component với config:
import Toast from 'react-native-toast-message';
import { toastConfig } from './toastConfig';

function App() {
  return (
    <>
      <YourNavigator />
      <Toast config={toastConfig} />
    </>
  );
}

// 3. Sử dụng ở bất kỳ đâu:
import { showErrorToast, showSuccessToast, showWarningToast, showInfoToast } from './toastConfig';

// Error
showErrorToast('Lỗi', 'Không thể kết nối đến server');

// Success
showSuccessToast('Thành công', 'Đã lưu thông tin');

// Warning
showWarningToast('Cảnh báo', 'Dung lượng sắp đầy');

// Info
showInfoToast('Thông báo', 'Có bản cập nhật mới');

// Hoặc dùng trực tiếp:
import Toast from 'react-native-toast-message';

Toast.show({
  type: 'error',
  text1: 'Lỗi',
  text2: 'Không thể kết nối',
});
*/