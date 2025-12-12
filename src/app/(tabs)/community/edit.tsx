import React, { useState, useEffect } from 'react';
import { Alert, Image } from 'react-native';
import { YStack, XStack, Text, Button, Card, Input } from 'tamagui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { apiRequest } from '../../../server/users';
import { eventBus } from '../../../lib/eventBus';

export default function EditPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const postId = params.postId as string | undefined;
  const initialContent = params.content ? decodeURIComponent(params.content as string) : '';
  const initialImage = params.imageUrl ? decodeURIComponent(params.imageUrl as string) : '';

  const [content, setContent] = useState(initialContent || '');
  const [imageUrl, setImageUrl] = useState(initialImage || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(initialContent || '');
    setImageUrl(initialImage || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Load post data when opening the edit screen
  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await apiRequest(`/api/posts/${postId}`, { auth: true });
        const p = (res as any)?.data?.post || (res as any)?.data || res;
        setContent(p?.content || '');
        setImageUrl(p?.imageUrl || p?.images?.[0]?.url || '');
      } catch (err) {
        console.error('[Edit] loadPost error', err);
      }
    };

    if (postId) loadPost();
  }, [postId]);

  const handleSave = async () => {
    if (!postId) return Alert.alert('Lỗi', 'Không tìm thấy bài viết để chỉnh sửa');
    const trimmed = (content || '').trim();
    if (!trimmed) return Alert.alert('Lỗi', 'Nội dung không được để trống');

    setSaving(true);
    try {
      const res = await apiRequest(`/api/posts/${postId}`, {
        method: 'PUT',
        auth: true,
        body: {
          content: trimmed,
          imageUrl: imageUrl || undefined,
        },
      });

      // Refresh the feed in the community tab, wait for it to complete, then go back
      try {
        await eventBus.emitAsync('reloadFeed');
      } catch (e) {
        console.error('[Edit] emitAsync reloadFeed error', e);
      }

      Alert.alert('Thành công', res?.message || 'Đã cập nhật bài viết', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('[EditPost] save error', err);
      Alert.alert('Lỗi', err?.message || 'Không thể lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  return (
    <YStack flex={1} padding={16} backgroundColor="#F6F8FB">
      <Card padding={12} borderRadius={12} backgroundColor="#fff">
        <XStack alignItems="center" justifyContent="space-between">
          <Text fontSize={16} fontWeight="700">Sửa bài viết</Text>
          <Button backgroundColor="transparent" onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#111" />
          </Button>
        </XStack>

        <YStack marginTop={12}>
          <Input
            multiline
            numberOfLines={6}
            value={content}
            onChangeText={setContent}
            placeholder="Nội dung bài viết"
            backgroundColor="#F7F8FC"
            borderRadius={12}
            padding={10}
            fontSize={14}
          />

          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: 200, marginTop: 12, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : null}

          <XStack marginTop={12} gap={8}>
            <Button
              flex={1}
              height={44}
              borderRadius={10}
              backgroundColor="#E5E7EB"
              onPress={() => router.back()}
            >
              <Text>Huỷ</Text>
            </Button>

            <Button
              flex={1}
              height={44}
              borderRadius={10}
              backgroundColor="#FF2FB2"
              onPress={handleSave}
              disabled={saving}
            >
              <Text color="#fff" fontWeight="700">{saving ? 'Đang lưu...' : 'Lưu'}</Text>
            </Button>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
