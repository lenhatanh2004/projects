import React, { useState, useEffect, useRef } from 'react';
import { FlatList, Alert, TextInput } from 'react-native';
import { YStack, XStack, Card, Button, Text, Separator, Spinner, Sheet, ScrollView } from 'tamagui';
import { apiGet } from '../../../lib/api';
import { analyzeDream, fetchDreamStats, removeDream } from '../../../lib/dreamApi';
import type { DreamItem, DreamStats as DreamStatsType, DreamCategory } from '../../../types/dream';

const PRIMARY = '#9B59FF';
const PRIMARY_PRESSED = '#8B4AE8';
const BG = '#F4F7FB';

type EmotionKey = 'stress'|'fear'|'anxiety'|'sadness'|'happy'|'neutral'|'confusion';
const CATEGORIES: EmotionKey[] = ['stress','fear','anxiety','sadness','happy','neutral','confusion'];

export function normalizePercent(raw: unknown): number {
  const v = Number(raw ?? 0);
  if (!Number.isFinite(v)) return 0;
  const p = v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, Math.round(p)));
}

const catLabel: Record<EmotionKey, string> = {
  stress: 'Căng thẳng', fear: 'Sợ hãi', anxiety: 'Lo âu', sadness: 'Buồn bã',
  happy: 'Vui', neutral: 'Trung tính', confusion: 'Mơ hồ',
};

const safeWidth = (n?: number) =>
  isFinite(Number(n)) ? Math.min(100, Math.max(0, Number(n))) : 0;

function normalizeEmotionScores(raw?: Record<string, number>) {
  const keys = CATEGORIES;
  const safe: Record<string, number> = {};
  let sum = 0;
  for (const k of keys) {
    const v = Number(raw?.[k] ?? 0);
    const clamped = isFinite(v) && v > 0 ? v : 0;
    safe[k] = clamped; sum += clamped;
  }
  if (sum <= 0) {
    return { percentages: Object.fromEntries(keys.map(k => [k, 0])) as Record<EmotionKey, number>, topLabel: 'neutral' as EmotionKey, confidence: 0 };
  }
  const percentages: Record<EmotionKey, number> = {} as any;
  let maxKey: EmotionKey = 'neutral'; let maxVal = -1;
  for (const k of keys) {
    const p = Math.min(100, Math.max(0, (safe[k] / sum) * 100));
    const rounded = Math.round(p * 10) / 10;
    percentages[k] = rounded;
    if (safe[k] > maxVal) { maxVal = safe[k]; maxKey = k; }
  }
  const confidence = Math.round((maxVal / sum) * 100);
  return { percentages, topLabel: maxKey, confidence };
}

const CATEGORY_CHIPS = [
  { key: undefined as EmotionKey | undefined, label: 'Tất cả' },
  ...CATEGORIES.map(cat => ({ key: cat, label: catLabel[cat] }))
];

// 👉 Emotion labels & top picker
const EMOTION_LABELS: Record<EmotionKey, string> = catLabel;

// Chuyển object điểm cảm xúc -> mảng đã sort giảm dần
function pickTopEmotions(scores: Partial<Record<EmotionKey, number>>, topN = 2) {
  const arr = Object.entries(scores || {})
    .filter(([k, v]) => typeof v === 'number' && !Number.isNaN(v))
    // API có thể trả theo thang 0..1 hoặc 0..100, chuẩn hoá về %
    .map(([k, v]) => ({ key: k as EmotionKey, value: v! > 1 ? v! : v! * 100 }))
    .sort((a, b) => b.value - a.value);

  // Lọc các giá trị thật sự > 0
  const picked = arr.filter(e => e.value > 0).slice(0, topN);
  return picked;
}

// Lightweight type for items shown in the history list
type DreamHistoryItem = {
  _id: string;
  date: string;
  category: string;
  interpretation?: string;
  confidence?: number;
  tips?: string;
  topEmotions?: Array<{ key: EmotionKey; label: string; percent: number }>;
  primaryEmotion?: EmotionKey;
  // allow extra fields returned from the backend (dreamText, probabilities, analyzedAt, etc.)
  [key: string]: any;
};


// Render a single probability bar (BE returns 0..1)
const ProbBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const pct = normalizePercent(value);
  return (
    <YStack marginVertical={6}>
      <XStack justifyContent="space-between" marginBottom={4}>
        <Text fontSize={13}>{label}</Text>
        <Text fontSize={13}>{pct}%</Text>
      </XStack>
      <YStack height={8} backgroundColor="#e5e7eb" borderRadius={4} overflow="hidden">
        <YStack backgroundColor={PRIMARY} height={8} width={`${pct}%`} />
      </YStack>
    </YStack>
  );
};


const Tag = ({ label }: { label: string }) => (
  <XStack
    paddingHorizontal={8}
    paddingVertical={4}
    borderRadius={999}
    backgroundColor="#F3E8FF"
    marginRight={6}
    marginBottom={6}
    borderWidth={1}
    borderColor="#E8ECF3"
  >
    <Text color={PRIMARY} fontSize={12} fontWeight="600">{label}</Text>
  </XStack>
);

const MoodPill = ({ mood }: { mood: string }) => {
  const bgColor =
    mood === 'Tích cực' || mood === 'positive' ? '#dcfce7' :
    mood === 'Âm tính' || mood === 'negative' ? '#fee2e2' :
    '#F3E8FF';
  const textColor =
    mood === 'Tích cực' || mood === 'positive' ? '#16a34a' :
    mood === 'Âm tính' || mood === 'negative' ? '#dc2626' :
    PRIMARY;
  return (
    <XStack
      paddingHorizontal={10}
      paddingVertical={4}
      borderRadius={999}
      backgroundColor={bgColor}
      marginRight={8}
    >
      <Text color={textColor} fontWeight="700" fontSize={12}>{mood}</Text>
    </XStack>
  );
};


const DreamCard = ({ item, onDelete }: { item: DreamHistoryItem; onDelete: (id: string) => void }) => {
  const time = new Date(item.date || item.analyzedAt || new Date());
  
  return (
    <Card
      elevate
      backgroundColor="#fff"
      borderRadius={16}
      padding={14}
      marginBottom={12}
      borderWidth={1}
      borderColor="#F1F5F9"
    >
      <XStack justifyContent="space-between" alignItems="flex-start" marginBottom={12} gap={8}>
        {/* Left: Timestamp + emotion chips */}
        <YStack flex={1} minWidth={0}>
          <Text fontWeight="700" color="#0f172a" fontSize={12}>
            {time.toLocaleDateString('vi-VN')} {time.toLocaleTimeString('vi-VN').slice(0, 5)}
          </Text>
          {/* 👉 Cảm xúc trội (1–2 chip) ngay dưới thời gian */}
          {!!item.topEmotions?.length && (
            <XStack marginTop={6} gap={8} flexWrap="wrap">
              {item.topEmotions.map((e) => (
                <XStack
                  key={e.key}
                  paddingHorizontal={10}
                  paddingVertical={4}
                  borderRadius={999}
                  backgroundColor="#ede9fe"
                  borderWidth={1}
                  borderColor="#c4b5fd"
                >
                  <Text color="#5b21b6" fontWeight="600" fontSize={12}>
                    {e.label} {!!e.percent && `· ${e.percent}%`}
                  </Text>
                </XStack>
              ))}
            </XStack>
          )}
        </YStack>
        {/* Right: Delete button */}
        <Button
          size="$3"
          backgroundColor="#fee2e2"
          color="#b91c1c"
          borderRadius={12}
          onPress={() => onDelete(item._id)}
          borderWidth={1}
          borderColor="#fca5a5"
        >
          Xoá
        </Button>
      </XStack>
      {!!item.dreamText && <Text color="#334155" marginBottom={8}>{item.dreamText}</Text>}
      {!!item.interpretation && (
        <YStack backgroundColor="#F8FAFC" borderRadius={12} padding={10} marginTop={4}>
          <Text color="#0f172a" fontWeight="700" marginBottom={6}>AI Insight</Text>
          <Text color="#475569">{item.interpretation}</Text>
        </YStack>
      )}
      {!!item.tips && (
        <YStack backgroundColor="#FEF3C7" borderRadius={12} padding={10} marginTop={8}>
          <Text color="#92400e" fontWeight="700" marginBottom={4}>Gợi ý</Text>
          <Text color="#78350f">{item.tips}</Text>
        </YStack>
      )}
      {/* 👉 Cảm xúc trội (1–2 chip) – now in header */}
    </Card>
  );
};

const DreamsScreen: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [result, setResult] = useState<DreamItem | null>(null);
  const [history, setHistory] = useState<DreamHistoryItem[]>([]);
  const [stats, setStats] = useState<DreamStatsType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingList(true);
        setLoadingStats(true);
        const [h, s] = await Promise.all([fetchHistory(), fetchDreamStats()]);
        // fetchHistory already normalizes
        setStats(s || null);
      } catch (e: any) {
        Alert.alert('Lỗi', e?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoadingList(false);
        setLoadingStats(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (history && !Array.isArray(history)) {
      console.warn('[Dreams] history is not array:', history);
    }
  }, [history]);

  const onAnalyze = async () => {
    if (!prompt.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả giấc mơ');
      return;
    }
    setSubmitting(true);
    try {
      const item = await analyzeDream(prompt.trim());
      setResult(item);
      // 👉 Build emotion chips from API scores
      const scores = (item as any).probabilities ?? (item as any).emotions ?? {};
      const top = pickTopEmotions(scores as Partial<Record<EmotionKey, number>>, 2);
      const topChips = top.map(e => ({
        key: e.key,
        label: EMOTION_LABELS[e.key] ?? e.key,
        percent: Math.round(e.value),
      }));
      // optimistic prepend — normalize to DreamHistoryItem shape
      const newItem: DreamHistoryItem = {
        ...item,
        date: String(item.analyzedAt ?? new Date().toISOString()),
        topEmotions: topChips,
        primaryEmotion: topChips[0]?.key || 'neutral',
      };
      setHistory(prev => [newItem, ...prev]);
      // refresh stats after analyze
      fetchStats();
      setPrompt('');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể phân tích giấc mơ');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const s = await fetchDreamStats();
      setStats(s || null);
    } catch (e: any) {
      console.error('[Dreams] stats error', e);
    } finally {
      setLoadingStats(false);
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá giấc mơ này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          const keep = [...history];
          setHistory(prev => prev.filter(x => x._id !== id));
          try {
            await removeDream(id);
            await fetchStats();
          } catch (e: any) {
            setHistory(keep);
            Alert.alert('Lỗi', e?.message || 'Không thể xoá giấc mơ');
          }
        }
      }
    ]);
  };

  const handleDelete = async (id: string) => {
    const snapshot = history;
    setHistory(prev => prev.filter(x => x._id !== id));
    try {
      await removeDream(id);
      await fetchStats();
    } catch (e) {
      setHistory(snapshot);
      Alert.alert('Lỗi', 'Không thể xoá giấc mơ. Vui lòng thử lại.');
    }
  };

  

  const fetchHistory = async (page: number = 1, limit: number = 20, category?: string) => {
    setLoadingList(true);
    try {
      const url = `/api/dreams/history?page=${page}&limit=${limit}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
      const res = await apiGet(url);
      const raw = (res?.data ?? res?.history ?? res?.items ?? res) as unknown;
      let list: DreamHistoryItem[] = [];
      if (Array.isArray(raw)) list = raw as DreamHistoryItem[];
      else if (raw && typeof raw === 'object') list = Object.values(raw) as DreamHistoryItem[];
      // ensure date exists on each item and extract top emotions
      const normalized = list.map(it => {
        // 👉 Build emotion chips from API scores
        const scores = (it as any).probabilities ?? (it as any).emotions ?? {};
        const top = pickTopEmotions(scores as Partial<Record<EmotionKey, number>>, 2);
        const topChips = top.map(e => ({
          key: e.key,
          label: EMOTION_LABELS[e.key] ?? e.key,
          percent: Math.round(e.value),
        }));
        return {
          ...it,
          date: String((it as any).analyzedAt ?? (it as any).createdAt ?? it.date ?? new Date().toISOString()),
          topEmotions: topChips,
          primaryEmotion: topChips[0]?.key || 'neutral',
        };
      });
      setHistory(normalized);
    } catch (e: any) {
      console.error('[Dreams] fetch error', e);
      setHistory([]);
    } finally {
      setLoadingList(false);
    }
  };

  return (
    <YStack backgroundColor={BG} flex={1} padding={0}>
      {/* (A) Phân tích giấc mơ */}
      <Card backgroundColor="#fff" borderRadius={16} padding={16} margin={16} marginBottom={12}>
        <YStack>
          <Text fontSize={18} fontWeight="bold" marginBottom={8} color={PRIMARY}>Phân tích giấc mơ</Text>
          <TextInput
            multiline
            style={{
              marginTop: 8,
              minHeight: 120,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E4E4E4',
              backgroundColor: '#F8F8F8',
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
            }}
            placeholder="Hãy mô tả giấc mơ của bạn..."
            value={prompt}
            onChangeText={setPrompt}
          />
          <Button
            height={52}
            borderRadius={14}
            backgroundColor={PRIMARY}
            pressStyle={{ backgroundColor: PRIMARY_PRESSED }}
            onPress={onAnalyze}
            disabled={submitting}
            fontSize={16}         
            letterSpacing={0.5}
            color="#fff"
            fontWeight="700"
          >
            {submitting ? 'Đang phân tích…' : 'PHÂN TÍCH AI'}
          </Button>
        </YStack>
      </Card>
      {/* (B) Lịch sử giấc mơ */}
      <Card backgroundColor="#fff" borderRadius={16} padding={16} margin={16} marginBottom={12}>
        <YStack>
          <Text fontSize={18} fontWeight="bold" marginBottom={8} color={PRIMARY}>Lịch sử giấc mơ</Text>
          {/* Bộ lọc mood / category */}
          <XStack
            flexWrap="wrap"
            rowGap={8}
            columnGap={8}
            marginTop={12}
            marginBottom={12}
          >
            {CATEGORY_CHIPS.map(chip => {
              const isActive = selectedCategory === chip.key;
              return (
                <Button
                  key={String(chip.key ?? 'all')}
                  size="$2"
                  borderRadius={999}
                  paddingHorizontal={14}
                  height={32}
                  backgroundColor={isActive ? PRIMARY : '#F3E8FF'}
                  borderColor={isActive ? PRIMARY : '#E2D4FF'}
                  borderWidth={1}
                  onPress={async () => {
                    setSelectedCategory(chip.key);
                    await fetchHistory(1, 10, chip.key);
                  }}
                >
                  <Text fontSize={13} fontWeight="600" color={isActive ? '#FFFFFF' : '#5A3CB0'}>
                    {chip.label}
                  </Text>
                </Button>
              );
            })}
          </XStack>
          {!loadingList && history.length === 0 && (
            <Text textAlign="center" color="#888" marginVertical={20}>
              Chưa có giấc mơ nào được phân tích.
            </Text>
          )}
          <FlatList
            data={Array.isArray(history) ? history : []}
            keyExtractor={(item: DreamHistoryItem, index) => (item._id || (item as any).id || index.toString())}
            renderItem={({ item, index }) => (
              <DreamCard key={(item._id || (item as any).id || index.toString())} item={item} onDelete={handleDelete} />
            )}
            contentContainerStyle={{ paddingBottom: 80 }}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </YStack>
      </Card>
      {/* (C) Thống kê giấc mơ (optional) */}
      {stats && stats.total > 0 && (
        <Card backgroundColor="#fff" borderRadius={16} padding={16} margin={16} marginBottom={12}>
          <YStack>
            <Text fontSize={18} fontWeight="bold" marginBottom={8} color={PRIMARY}>Thống kê giấc mơ</Text>
            <Text>Tổng số giấc mơ: {stats.total}</Text>
            <Text>Độ tin cậy trung bình: {normalizePercent(stats.avgConfidence)}%</Text>
            <Separator marginVertical={8} />
            <YStack>
              {CATEGORIES.map((cat) => {
                const count = stats.byCategory?.[cat] ?? 0;
                const pct = normalizePercent(stats.total ? (count / stats.total) * 100 : 0);
                return (
                  <XStack key={cat} alignItems="center" marginBottom={6}>
                    <Text width={80}>{cat}</Text>
                    <Text width={40}>{count}</Text>
                    <YStack flex={1} height={8} borderRadius={4} overflow="hidden" backgroundColor="#e5e7eb">
                      <YStack backgroundColor={PRIMARY} height={8} width={`${pct}%`} />
                    </YStack>
                    <Text marginLeft={8}>{pct}%</Text>
                  </XStack>
                );
              })}
            </YStack>
          </YStack>
        </Card>
      )}
    </YStack>
  );
};

export default DreamsScreen;
