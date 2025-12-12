import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import PostCard, { Post } from './PostCard';
import { apiRequest, togglePostLike, getPostComments, getUserFriends, updateComment, createCommentApi, getFriendStatus, getFullImageUrl } from '../../../server/users';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111111',
  subtext: '#6B6B6B',
  border: '#E5E7EB',
  primary: '#EC4899',
};

type CommunityProfile = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  friendStatus?: 'none' | 'pending' | 'friends' | 'blocked';
  postCount?: number;
  friendCount?: number;
  gender?: string;
};

export default function CommunityProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({});
  const [friends, setFriends] = useState<any[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [editingComment, setEditingComment] = useState<{ postId: string; comment: any } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Map backend post to UI Post format
  const mapApiPostToUi = (raw: any, profile: any | null): Post => {
    const user = raw.user || raw.author || {};
    const name = user.name || profile?.name || 'Người dùng FlowState';

    // Handle shared post data
    let sharedPost = undefined;
    const rawShared = raw.sharedPost || raw.sharedPostId;

    // Only map if it's a populated object, not just an ID string
    if (rawShared && typeof rawShared === 'object') {
      const sharedUser = rawShared.userId || rawShared.user || {};

      sharedPost = {
        id: rawShared._id || rawShared.id || '',
        content: rawShared.content || '',
        imageUrl: rawShared.images?.[0]?.url || rawShared.imageUrl || rawShared.image || undefined,
        user: {
          name: sharedUser.name || 'Người dùng FlowState',
          avatarUrl: sharedUser.avatar || sharedUser.avatarUrl || undefined,
        },
      };
    }

    let avatarUrl = user.avatarUrl || user.avatar || profile?.avatarUrl || undefined;
    if (avatarUrl === 'null' || avatarUrl === 'undefined') avatarUrl = undefined;

    return {
      id: raw._id || raw.id,
      user: {
        id: user.id || user._id || raw.userId || profile?.id || '',
        name,
        avatarUrl: getFullImageUrl(user.avatarUrl || user.avatar || profile?.avatarUrl),
        badge: user.badge,
        gender: user.gender || profile?.gender,
      },
      createdAgo: raw.createdAgo ||
        (raw.createdAt ? new Date(raw.createdAt).toLocaleString('vi-VN') : ''),
      content: raw.content || raw.text || '',
      hashtags: raw.hashtags || [],
      likeCount: raw.likeCount ?? (Array.isArray(raw.likes) ? raw.likes.length : 0),
      commentCount: raw.commentCount ?? (Array.isArray(raw.comments) ? raw.comments.length : 0),
      hasLiked: !!(raw.hasLiked ?? raw.isLiked),
      imageUrl: raw.images?.[0]?.url || raw.imageUrl || raw.image,
      sharedPost,
    };
  };

  // Map API comment to UI format
  const mapApiCommentToUi = (apiComment: any) => ({
    id: apiComment._id || apiComment.id,
    author: apiComment.userId?.name || apiComment.author || 'Người dùng',
    text: apiComment.content || apiComment.text || '',
    createdAgo: apiComment.createdAgo || 'Vừa xong',
    userId: apiComment.userId?._id || apiComment.userId?.id || apiComment.userId,
  });

  // Validate userId param early (but after hooks to preserve rules of hooks)
  if (!userId || userId === 'undefined') {
    console.error('❌ userId invalid:', userId);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Stack.Screen options={{ title: 'Trang cá nhân' }} />
        <View style={{ padding: 16 }}>
          <Text>Lỗi: Không tìm thấy người dùng.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----- Load profile + posts từ BE -----
  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileRes, postsRes, statusRes] = await Promise.all([
        apiRequest(`/api/users/${userId}`, { auth: true }),
        apiRequest(`/api/posts/user/${userId}`, { auth: true }),
        getFriendStatus(userId).catch(() => ({ status: 'none' })),
      ]);

      const profileData = (profileRes as any)?.data || profileRes;

      // Merge friend status if valid
      if (statusRes && (statusRes as any).status) {
        profileData.friendStatus = (statusRes as any).status;
      }

      const postsData =
        (postsRes as any)?.data?.posts || (postsRes as any).posts || (postsRes as any).items || postsRes;

      const mappedPosts: Post[] = Array.isArray(postsData)
        ? postsData.map((p) => mapApiPostToUi(p, profileData))
        : [];

      setProfile(profileData);
      setPosts(mappedPosts);

      // Load friends
      try {
        const friendsRes = await getUserFriends(userId, 1, 20);
        const friendsData = (friendsRes as any)?.data?.friends || (friendsRes as any)?.friends || [];
        const total = (friendsRes as any)?.data?.pagination?.total || friendsData.length;
        setFriends(friendsData);
        setFriendCount(total);
      } catch (err) {
        console.log('[Profile] load friends error', err);
      }
    } catch (error) {
      console.log('[CommunityProfile] loadProfile error', error);
      Alert.alert('Lỗi', 'Không thể tải trang cá nhân cộng đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Load current user ID for comment editing permissions
  useEffect(() => {
    const loadMe = async () => {
      try {
        const me = await apiRequest('/api/users/me', { auth: true });
        const user = me.user || me.data?.user || me;
        setCurrentUserId(user?.id || user?._id || null);
      } catch (error) {
        console.log('[Profile] loadMe error', error);
      }
    };
    loadMe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // ----- LIKE trong trang cá nhân -----
  const handleLikePost = async (postId: string) => {
    try {
      const res = await togglePostLike(postId);
      const liked = (res as any)?.data?.liked;
      const likeCountFromApi = (res as any)?.data?.likeCount;

      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
              ...p,
              hasLiked:
                typeof liked === 'boolean' ? liked : !p.hasLiked,
              likeCount:
                typeof likeCountFromApi === 'number'
                  ? likeCountFromApi
                  : p.likeCount + (p.hasLiked ? -1 : 1),
            }
            : p,
        ),
      );
    } catch (err) {
      console.log('[CommunityProfile] like error', err);
      Alert.alert('Lỗi', 'Không thể like bài viết');
    }
  };



  // Check if user can edit a comment
  const canEditComment = (comment: any) => {
    if (!currentUserId) return false;
    return comment.userId === currentUserId;
  };

  // Submit or update comment
  const handleSubmitComment = async () => {
    if (!activeCommentPostId || !commentText.trim()) return;

    try {
      if (editingComment) {
        const content = commentText.trim();
        await updateComment(editingComment.comment.id, content);

        setCommentsByPost(prev => ({
          ...prev,
          [editingComment.postId]: (prev[editingComment.postId] || []).map(c =>
            c.id === editingComment.comment.id ? { ...c, text: content } : c,
          ),
        }));

        setEditingComment(null);
        setCommentText('');
        // Keep activeCommentPostId to keep showing comments
        return;
      }

      // Create new comment
      const res = await createCommentApi({
        postId: activeCommentPostId,
        content: commentText.trim(),
      });

      const apiComment = (res as any)?.comment || (res as any)?.data || res;
      const newComment = mapApiCommentToUi(apiComment);

      setCommentsByPost(prev => ({
        ...prev,
        [activeCommentPostId]: [
          ...(prev[activeCommentPostId] || []),
          newComment,
        ],
      }));

      setPosts(prev =>
        prev.map(p =>
          p.id === activeCommentPostId
            ? { ...p, commentCount: p.commentCount + 1 }
            : p,
        ),
      );

      setCommentText('');
    } catch (err) {
      console.log('[Profile] submit comment error', err);
      Alert.alert('Lỗi', 'Không thể gửi bình luận');
    }
  };

  // ----- UI header Trang cá nhân -----
  const renderHeader = () => {
    if (!profile) return null;

    // Use loose comparison or string conversion for safety
    const isMe = currentUserId && String(profile.id) === String(currentUserId);

    const initials =
      profile.name
        ?.split(' ')
        .map((s: string) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';

    const statusLabel =
      profile.friendStatus === 'friends'
        ? 'Bạn bè'
        : profile.friendStatus === 'pending'
          ? 'Đã gửi lời mời'
          : profile.friendStatus === 'blocked'
            ? 'Đã chặn'
            : 'Chưa kết bạn';

    return (
      <View
        style={{
          padding: 16,
          backgroundColor: COLORS.card,
          borderBottomWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              source={
                getFullImageUrl(profile.avatarUrl)
                  ? { uri: getFullImageUrl(profile.avatarUrl) }
                  : profile.gender === 'female'
                    ? require('../../../assets/images/avatar-girl.png')
                    : require('../../../assets/images/avatar-placeholder.png')
              }
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </View>

          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
              {profile.name}
            </Text>
            {profile.bio ? (
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: COLORS.subtext,
                }}
              >
                {profile.bio}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: 'row',
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: COLORS.subtext, marginRight: 12 }}>
                {posts.length} bài viết
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.subtext }}>
                {friendCount} bạn bè
              </Text>
            </View>
          </View>

          {/* Friends section */}
          {friends.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Bạn bè ({friendCount})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {friends.slice(0, 10).map((friend: any) => {
                    // Backend returns friendId as populated user object
                    const fUser = friend.friendId || friend.user || friend;
                    const fId = fUser._id || fUser.id;
                    const fName = fUser.name || 'Bạn bè';
                    const fAvatar = fUser.avatarUrl || fUser.avatar;

                    if (!fId) return null; // Skip if no valid ID

                    return (
                      <TouchableOpacity
                        key={fId}
                        style={{ alignItems: 'center', width: 70 }}
                        onPress={() => router.push(`/community/${fId}`)}
                      >
                        <View
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: COLORS.card,
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {fAvatar ? (
                            <Image
                              source={{ uri: fAvatar }}
                              style={{ width: 60, height: 60 }}
                            />
                          ) : (
                            <Text style={{ fontSize: 20, color: COLORS.subtext }}>
                              {fName.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            color: COLORS.text,
                            marginTop: 4,
                            textAlign: 'center',
                          }}
                          numberOfLines={1}
                        >
                          {fName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        <View style={{ marginTop: 12, flexDirection: 'row' }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: '#FDF2FF',
              // Hide if it's me
              display: isMe ? 'none' : 'flex',
            }}
          >
            {!isMe && (
              <Text style={{ fontSize: 12, color: COLORS.primary }}>{statusLabel}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      comments={commentsByPost[item.id] || []}

      onToggleLike={() => handleLikePost(item.id)}

      // Comment props
      commentText={activeCommentPostId === item.id ? commentText : undefined}
      onChangeCommentText={(text) => {
        setActiveCommentPostId(item.id);
        setCommentText(text);
      }}
      onSubmitComment={handleSubmitComment}
      onAddComment={() => { }} // Legacy, not used when controlled

      onToggleComments={async (postId, nextShow) => {
        if (nextShow && !commentsByPost[postId]) {
          try {
            const res = await getPostComments(postId);
            const raw = (res as any)?.data?.comments || (res as any)?.comments || [];
            const mapped = raw.map(mapApiCommentToUi);
            setCommentsByPost(prev => ({ ...prev, [postId]: mapped }));
          } catch (err) {
            console.log('[Profile] load comments error', err);
          }
        }
      }}
      onFocusCommentInput={() => {
        setActiveCommentPostId(item.id);
      }}

      onEditComment={(comment) => {
        setEditingComment({ postId: item.id, comment });
        setCommentText(comment.text);
        setActiveCommentPostId(item.id);
      }}
      canEditComment={canEditComment}

      onShare={() => {
        Alert.alert('Chia sẻ', 'Chức năng chia sẻ sẽ dùng cùng logic với tab Cộng đồng.');
      }}
      onReport={(post) => {
        Alert.alert('Báo cáo', 'Chức năng báo cáo sẽ được hoàn thiện.');
      }}
      onHide={() => { }}
      onMute={() => { }}
      onUserPress={() => { }}
      canEdit={currentUserId === item.user.id}
      onEdit={(post) => {
        router.push({
          pathname: '/(tabs)/community/edit',
          params: { postId: post.id },
        });
      }}
    />
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Stack.Screen options={{ title: 'Trang cá nhân' }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 8, color: COLORS.subtext }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Stack.Screen options={{ title: 'Trang cá nhân' }} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {renderHeader()}

        {posts.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: COLORS.subtext }}>Chưa có bài viết nào.</Text>
          </View>
        ) : (
          posts.map(item => (
            <React.Fragment key={item.id}>
              {renderPostItem({ item })}
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
