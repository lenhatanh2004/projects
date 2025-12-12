import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, View, TextInput, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { YStack, XStack, Card, Text, Input, Button, Theme } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import LinearGradient from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

const PRIMARY = '#9B59FF';
const GRADIENT = ['#9B59FF', '#7F00FF'];
const TAB_BAR_HEIGHT = 72;

type Msg = { id: string; role: 'user' | 'ai'; text: string };

export default function AIChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Ẩn tab bar khi vào màn AI chat, hiện lại khi rời màn
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();

      // Ẩn bottom tab
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      // Khi rời màn AI chat → hiện lại tab bar
      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation]),
  );

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Xin chào 👋 Mình là trợ lý giấc ngủ AI FlowState. Hôm nay bạn muốn nghe chuyện, thiền hay cần lời khuyên để ngủ ngon hơn?',
    },
  ]);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const sendMsg = () => {
    const content = text.trim();
    if (!content) return;

    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: content };
    setMsgs((m) => [...m, userMsg]);
    setText('');
    setTimeout(() => {
      const reply: Msg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: suggest(content),
      };
      setMsgs((m) => [...m, reply]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 800);
  };

  const renderMessage = ({ item, index }: { item: Msg; index: number }) => {
    return (
      <View
        key={`${item.id}-${index}`}
        style={{
          alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
          marginBottom: 12,
          maxWidth: '80%',
        }}
      >
        <View
          style={{
            backgroundColor: item.role === 'user' ? PRIMARY : '#FFFFFF',
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 16,
            elevation: 2,
          }}
        >
          <Text fontSize={15} color={item.role === 'user' ? '#FFFFFF' : '#1F1F1F'} lineHeight={20}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FB' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* danh sách tin nhắn */}
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {msgs.map((item, index) => renderMessage({ item, index }))}
          </ScrollView>
        </View>

        {/* THANH INPUT – luôn nằm cuối, không absolute */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập điều bạn muốn tâm sự..."
            value={text}
            onChangeText={setText}
            multiline
          />

          <Button
            height={48}
            width={48}
            borderRadius={14}
            backgroundColor={PRIMARY}
            pressStyle={{ backgroundColor: '#7F00FF' }}
            onPress={sendMsg}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E8ECF3',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    fontSize: 15,
  },
});

function suggest(q: string) {
  const s = q.toLowerCase();
  if (s.includes('kể') || s.includes('chuyện'))
    return '🌙 Chuyện ngắn: "Giấc mơ trên mây" — bạn đang trôi bồng bềnh giữa làn mây ấm, nghe gió ru nhẹ nhàng...';
  if (s.includes('thiền') || s.includes('thư giãn'))
    return '🧘 Thiền dẫn: Hít vào 4s... giữ 4s... thở ra 6s. Cảm nhận cơ thể nhẹ như khói tan.';
  if (s.includes('mẹo') || s.includes('khó ngủ'))
    return '💡 Mẹo ngủ nhanh: tránh màn hình 30 phút trước khi ngủ, phòng mát 22°C, ánh sáng vàng ấm.';
  return 'Mình có thể kể chuyện, hướng dẫn thiền, hoặc gợi ý mẹo ngủ. Bạn muốn thử kiểu nào?';
}
