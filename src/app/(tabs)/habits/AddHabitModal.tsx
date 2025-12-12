// app/(tabs)/habits/AddHabitModal.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Stack, Link, router } from 'expo-router';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { X, Search, Plus } from '@tamagui/lucide-icons';
import { getHabitTemplates } from '../../../server/habits';

// Helper: flatten mọi style mảng -> object
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  StyleSheet.flatten(styles.filter(Boolean));

type HabitItem = {
  id: string;
  icon: string;
  name: string;
  category: string;
  color: string;
};
type Categories = Record<string, HabitItem[]>;

function withAlpha(hex: string, alpha = 0.12) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function AddHabitModal() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<HabitItem | null>(null);
  const [categories, setCategories] = useState<Categories>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res: any = await getHabitTemplates({ limit: 100 });
        console.log('[AddHabitModal] templates API:', res);
        const templates = Array.isArray(res?.templates) ? res.templates : [];
        const cats: Categories = {};
        templates.forEach((t: any) => {
          const catName = t.categoryDetails?.name || t.category || 'Khác';
          if (!cats[catName]) cats[catName] = [];
          cats[catName].push({
            id: t._id,
            icon: t.icon || '⭐',
            name: t.name,
            category: t.category,
            color: t.color || '#3b82f6',
          });
        });
        setCategories(cats);
      } catch (err) {
        console.error('[AddHabitModal] failed to fetch templates:', err);
        setCategories({});
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered: Categories = useMemo(() => {
    const f: Categories = {};
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    Object.keys(categories).forEach((cat) => {
      const items = categories[cat].filter((h) => h.name.toLowerCase().includes(q));
      if (items.length) f[cat] = items;
    });
    return f;
  }, [categories, searchTerm]);

  // Chỉ dùng param id (templateId)
  const goToCreateHabitDetail = (habit: HabitItem) => {
    setSelectedHabit(habit);
    router.push({
      pathname: '/(tabs)/habits/QuitSmokingHabit',
      params: {
        templateId: habit.id,
      },
    });
  };

  const handleContinue = () => {
      // Chưa chọn -> đi vào CreateHabitDetail không param (id = null)
      router.push('/(tabs)/habits/CreateHabitDetail');
  };

  const totalTemplates = Object.keys(categories).reduce(
    (acc, cat) => acc + categories[cat].length,
    0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tạo thói quen mới</Text>
        <Link href="/(tabs)/habits" asChild>
          <Pressable style={styles.iconBtn}>
            <X size={20} color="#111827" />
          </Pressable>
        </Link>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={styles.searchBox}>
          <Search size={18} color="#6b7280" />
          <TextInput
            placeholder="Tìm kiếm thói quen..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        {isLoading ? (
          <View style={styles.emptyBox}>
            <Text style={{ color: '#9ca3af' }}>Đang tải...</Text>
          </View>
        ) : Object.keys(filtered).length ? (
          Object.keys(filtered).map((cat) => (
            <View key={cat} style={{ marginBottom: 20 }}>
              <Text style={styles.sectionLabel}>{cat}</Text>

              {filtered[cat].map((habit) => (
                <Pressable
                  key={habit.id}
                  onPress={() => goToCreateHabitDetail(habit)}
                  style={styles.itemRow}
                >
                  <View
                    style={sx(styles.iconSquare, {
                      backgroundColor: withAlpha(habit.color, 0.12),
                      borderColor: withAlpha(habit.color, 0.4),
                    })}
                  >
                    <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={styles.itemCat} numberOfLines={1}>
                      {habit.category}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={{ color: '#9ca3af' }}>
              {totalTemplates === 0
                ? 'Không có thói quen mẫu nào'
                : 'Không tìm thấy thói quen phù hợp'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <Link href="/(tabs)/habits" asChild>
          <Pressable style={sx(styles.bottomBtn, { backgroundColor: '#f3f4f6' })}>
            <Text style={sx(styles.bottomText, { color: '#374151' })}>Hủy</Text>
          </Pressable>
        </Link>

        {/* Luôn màu xanh dương, nếu chưa chọn id thì vào CreateHabitDetail không param */}
        <Pressable
          onPress={handleContinue}
          style={sx(styles.bottomBtn, { backgroundColor: '#2563eb' })}
        >
          <Text style={sx(styles.bottomText, { color: '#fff' })}>Tạo thói quen tùy chỉnh</Text>
        </Pressable>
      </View>

      {/* Custom Habit Button */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <Link href="/(tabs)/habits/CreateHabitDetail" asChild>
          <TouchableOpacity style={styles.customBtn}>
            <Plus size={18} color="#2563eb" />
            <Text style={styles.customBtnText}>Tạo thói quen tùy chỉnh</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemCat: { fontSize: 12, color: '#6b7280' },

  emptyBox: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bottomBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomText: { fontSize: 14, fontWeight: '600' },

  customBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  customBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
