import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { YStack, XStack, Card, Text } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiGet } from '../../../lib/api';

const PRIMARY = '#7c4dff';

type SleepAudioItem = {
  id: string;
  _id?: string;
  slug?: string;
  type: 'sound' | 'story';
  name: string;
  audioUrl: string;
  duration?: number;
  displayDuration?: string;
  description?: string;
  category?: string;
};

// --- TAB 2: HỖ TRỢ NGỦ ---
function SleepSupportTab() {
  const [loading, setLoading] = useState(false);
  const [audioItems, setAudioItems] = useState<SleepAudioItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const router = useRouter();

  // tách sound / story cho dễ render
  const relaxSounds = audioItems.filter((x) => x.type === 'sound');
  const stories = audioItems.filter((x) => x.type === 'story');

  // lấy dữ liệu từ API
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiGet<{ data: SleepAudioItem[] }>(
          '/api/sleep-content?page=1&limit=20',
        );
        if (isMounted) setAudioItems(res.data || []);
      } catch (e: any) {
        console.error('[SleepSupportTab] fetch error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const playOrPause = useCallback(
    async (item: SleepAudioItem) => {
      try {
        // bấm lại đúng item đang play => pause & unload
        if (currentId === item.id && soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          setCurrentId(null);
          return;
        }

        // đang play cái khác => stop trước
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        console.log('AUDIO URL REAL:', item.audioUrl);
        const { sound } = await Audio.Sound.createAsync({
          uri: item.audioUrl,
        });
        soundRef.current = sound;
        setCurrentId(item.id);
        await sound.playAsync();
      } catch (err: any) {
        console.error(
          item.type === 'story' ? '[Sleep] playStory error:' : '[Sleep] playSound error:',
          err,
        );
      }
    },
    [currentId],
  );

  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingTop={40}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text marginTop={12} fontSize={15} color="#707070">
          Đang tải…
        </Text>
      </YStack>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* CARD TRÒ CHUYỆN CÙNG AI */}
      <Card
        borderRadius={20}
        padding={18}
        backgroundColor="#FFFFFF"
        borderWidth={1}
        borderColor="#ECE4FF"
        shadowColor="rgba(116, 85, 255, 0.3)"
        shadowOffset={{ width: 0, height: 6 }}
        shadowOpacity={0.2}
        shadowRadius={12}
        elevation={5}
        marginBottom={20}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <XStack alignItems="center" gap={10} flexShrink={1}>
            <Text fontSize={24} marginRight={4}>
              💬
            </Text>
            <YStack flexShrink={1}>
              <Text fontSize={18} fontWeight="700" color="#1E1B4B">
                Trò chuyện cùng AI
              </Text>
              <Text fontSize={13} color="#6B6B6B" marginTop={2}>
                Được hỗ trợ bởi trợ lý AI FlowState
              </Text>
            </YStack>
          </XStack>

          <Pressable
            onPress={() => {
              router.push('/sleep/ai-chat');
            }}
          >
            <YStack
              paddingHorizontal={18}
              paddingVertical={8}
              borderRadius={999}
              backgroundColor={PRIMARY}
              alignItems="center"
              justifyContent="center"
            >
              <Text
                fontSize={15}
                fontWeight="700"
                color="#FFFFFF"
              >
                Bắt đầu
              </Text>
            </YStack>
          </Pressable>
        </XStack>
      </Card>

      {/* ÂM THANH THƯ GIÃN */}
      <XStack alignItems="center" marginBottom={12}>
        <Text fontSize={20} fontWeight="700" color={PRIMARY} marginRight={8}>
          🎵
        </Text>
        <Text fontSize={20} fontWeight="700" color="#1E1B4B">
          Âm thanh thư giãn
        </Text>
      </XStack>

      <YStack gap={10} marginBottom={26}>
        {relaxSounds.map((item) => {
          const isPlaying = currentId === item.id;
          const emoji =
            item.slug === 'tieng-mua'
              ? '🌧️'
              : item.slug === 'song-bien'
              ? '🌊'
              : item.slug === 'rung-dem'
              ? '🌲'
              : '📡';

          return (
            <Pressable
              key={item.id}
              onPress={() => playOrPause(item)}
              style={{ width: '100%' }}
            >
              <XStack
                padding={16}
                borderRadius={16}
                backgroundColor="#FFFFFF"
                borderWidth={1}
                borderColor={isPlaying ? PRIMARY : '#E5E7EB'}
                alignItems="center"
                justifyContent="space-between"
              >
                <XStack alignItems="center" gap={12}>
                  <Text fontSize={26}>{emoji}</Text>
                  <YStack>
                    <Text fontSize={17} fontWeight="700" color="#111827">
                      {item.name}
                    </Text>
                    <Text fontSize={13} color="#6B7280">
                      {item.displayDuration ?? '10 phút'}
                    </Text>
                  </YStack>
                </XStack>

                <Ionicons
                  name={isPlaying ? 'pause-circle' : 'play-circle'}
                  size={30}
                  color={PRIMARY}
                />
              </XStack>
            </Pressable>
          );
        })}
      </YStack>

      {/* KỂ CHUYỆN RU NGỦ */}
      <XStack alignItems="center" marginBottom={12}>
        <Text fontSize={20} fontWeight="700" color={PRIMARY} marginRight={8}>
          📖
        </Text>
        <Text fontSize={20} fontWeight="700" color="#1E1B4B">
          Kể chuyện ru ngủ
        </Text>
      </XStack>

      <YStack gap={10} marginBottom={24}>
        {stories.map((item) => {
          const isPlaying = currentId === item.id;
          const icon =
            item.slug === 'thi-tran-ve-dem'
              ? '🌃'
              : item.slug === 'ai-giao-viec-cho-vua'
              ? '👑'
              : '⭐';

          return (
            <Pressable
              key={item.id}
              onPress={() => playOrPause(item)}
              style={{ width: '100%' }}
            >
              <XStack
                padding={16}
                borderRadius={16}
                backgroundColor="#FFFFFF"
                borderWidth={1}
                borderColor={isPlaying ? PRIMARY : '#E5E7EB'}
                alignItems="center"
                justifyContent="space-between"
              >
                <XStack alignItems="center" gap={12} flexShrink={1}>
                  <Text fontSize={26}>{icon}</Text>
                  <YStack flexShrink={1}>
                    <Text fontSize={17} fontWeight="700" color="#111827">
                      {item.name}
                    </Text>
                    <Text fontSize={13} color="#6B7280">
                      {item.displayDuration ?? '15 phút'}
                    </Text>
                  </YStack>
                </XStack>

                <Ionicons
                  name={isPlaying ? 'pause-circle' : 'play-circle'}
                  size={30}
                  color={PRIMARY}
                />
              </XStack>
            </Pressable>
          );
        })}
      </YStack>
    </ScrollView>
  );
}

export default SleepSupportTab;
