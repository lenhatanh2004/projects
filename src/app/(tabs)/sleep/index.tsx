// app/(tabs)/sleep/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import DreamsScreen from './dreams';
import SleepContent from './SleepContent';
import { ScrollView, Alert, Platform, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { YStack, XStack, Text, Button, Card, Input, Separator, } from 'tamagui';

import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';

import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../lib/api';

// Color constants for Sleep tabs (keep PRIMARY consistent across app)
const PRIMARY = '#9B59FF'; // Main purple
const PRIMARY_PRESSED = '#8B4AE8';
const BG = '#F4F7FB';

type Mood = '😴' | '😐' | '😊' | '😫' | '🤩';

export default function SleepLab() {
  const router = useRouter();
  const [tab, setTab] = useState<'journal' | 'support' | 'dreams'>('journal');

  // ----- Journal states -----
  const [bedTime, setBedTime] = useState('10:30 PM');
  const [wakeTime, setWakeTime] = useState('7:00 AM');
  const [quality, setQuality] = useState(4); // 1..5
  const [sleepDate, setSleepDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // Additional states required for the Journal UI
  const FACTORS = ['Uống coffee','Tập luyện','Stress','Ăn muộn','Đọc sách','Xem phim','Tắm nước ấm'] as const;

  const [mood, setMood] = useState<Mood>('😊');
  const [factors, setFactors] = useState<Record<string, boolean>>(Object.fromEntries(FACTORS.map(f => [f, false])) as Record<string, boolean>);

  const [logs, setLogs] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ID đang xoá (để disable nút)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Nạp dữ liệu ban đầu cho bảng thống kê
  useEffect(() => {
    let isCancelled = false;

    async function loadInitialSleepData() {
      try {
        // 1) Đọc local 7 ngày đã lưu trong AsyncStorage
        const stored = await AsyncStorage.getItem('sleepJournal');
        if (!isCancelled && stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setEntries(parsed);
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Sleep] Không đọc được sleepJournal từ AsyncStorage', error);
        }
      }

      try {
        // 2) Lấy log từ BE để cập nhật state logs
        const res = await apiGet('/api/sleep/logs?page=1&limit=10');
        const freshLogs = normalizeLogs(res?.data || []);
        if (isCancelled) return;

        setLogs(freshLogs);

        // Nếu chưa có entries từ AsyncStorage thì tạo entries từ log BE
        if (freshLogs.length > 0) {
          const mappedEntries = freshLogs
            .map((log: any) => {
              const dateISO = getYMDFromLog(log) || todayISO();
              const bed = log.sleepTime || '10:30 PM';
              const wake = log.wakeTime || '7:00 AM';
              const durationMin = diffMinutes(bed, wake);

              // Map wakeMood → emoji để bảng hiển thị giống UI hiện tại
              let moodEmoji: Mood = '😊';
              switch (log.wakeMood) {
                case 'met':
                  moodEmoji = '😫';
                  break;
                case 'cang_thang':
                  moodEmoji = '😐';
                  break;
                case 'thu_gian':
                  moodEmoji = '😊';
                  break;
                case 'vui':
                  moodEmoji = '🤩';
                  break;
                case 'buon':
                  moodEmoji = '😴';
                  break;
              }

              return {
                dateISO,
                bedTime: bed,
                wakeTime: wake,
                durationMin,
                quality: typeof log.quality === 'number' ? log.quality : 3,
                mood: moodEmoji,
                factors: Array.isArray(log.factors) ? log.factors : [],
              };
            })
            .filter((entry) => within7Days(entry.dateISO))
            .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
            .slice(0, 7);

          // Chỉ ghi đè entries nếu AsyncStorage chưa có gì
          setEntries((previous) => (previous.length > 0 ? previous : mappedEntries));

          // Lưu lại vào AsyncStorage để lần sau mở app nhanh hơn
          try {
            await AsyncStorage.setItem('sleepJournal', JSON.stringify(mappedEntries));
          } catch (error) {
            if (__DEV__) {
              console.warn('[Sleep] Không lưu lại mappedEntries vào AsyncStorage', error);
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Sleep] Lỗi khi lấy logs từ BE', error);
        }
      }
    }

    loadInitialSleepData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // map _id theo yyyy-mm-dd để disable nút theo hàng
  const idByDate = useMemo(() => {
    const m: Record<string, string> = {};
    for (const it of logs) {
      const ymd = String(it?.date || '').slice(0, 10);
      if (ymd && it?._id) m[ymd] = it._id;
    }
    return m;
  }, [logs]);

  const moodMap: Record<string, string> = {
    '😴': 'met',
    '😐': 'cang_thang',
    '😊': 'thu_gian',
    '😁': 'vui',
    '🥲': 'buon',
  };

  const factorMap: Record<string, string> = {
    'Uống coffee': 'cafe',
    'Tập luyện': 'tap_luyen',
    'Stress': 'stress',
    'Ăn muộn': 'an_muon',
    'Đọc sách': 'doc_sach',
    'Xem phim': 'xem_phim',
    'Tắm nước ấm': 'tam_nuoc_am',
    'Noise': 'on_ao',
  };

  const COL_DAY = 72;
  const COL_TIME = 64;      
  const COL_DURATION = 72; 
  const COL_STAR = 48;      
  const COL_MOOD = 64;      
  const HEADER_FONT = 9;

  function selectedFactorsFromState(factorsState: Record<string, boolean>) {
    return Object.keys(factorsState)
      .filter((k) => !!factorsState[k] && factorMap[k])
      .map((k) => factorMap[k]);
  }

  // Ensure each log item keeps BE _id; if backend sends `id` fallback to that.
  function normalizeLogs(items: any[] = []) {
    return (items || []).map((it: any) => ({
      ...it,
      _id: it._id ?? it.id ?? null,
    }));
  }

  // Helpers for date/time and id resolution
  // parse 12h time like "10:30 PM" into minutes since midnight
  function toMins12h(s: string) {
    const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return 0;
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return h * 60 + mm;
  }

  // keep the old name as an alias so other code doesn't need editing
  function toMinutes(t: string) {
    return toMins12h(t || '12:00 AM');
  }

  function diffMinutes(bed: string, wake: string) {
    const b = toMinutes(bed);
    const w = toMinutes(wake);
    const day = 24 * 60;
    const diff = (w - b + day) % day; // handle overnight
    return diff === 0 ? day : diff;
  }

  function crossesMidnight(bed: string, wake: string) {
    return toMins12h(wake) <= toMins12h(bed);
  }

  function shiftYMD(ymd: string, deltaDays: number) {
    const d = new Date(`${ymd}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  function getYMDFromLog(l: any) {
    if (!l) return '';
    if (typeof l.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.date)) return l.date;
    if (l.sleepAt) {
      try {
        return new Date(l.sleepAt).toISOString().slice(0, 10);
      } catch {}
    }
    return '';
  }

  const getIdForDate = async (dateISO: string) => {
    // try local logs first
    const local = logs.find((l) => String(l?.date || '').slice(0, 10) === dateISO);
    if (local?._id) return local._id;

    // fallback: refetch the first page and search again
    try {
      const res = await apiGet('/api/sleep/logs?page=1&limit=10');
      const fresh: any[] = Array.isArray(res?.data) ? res.data : (res?.data || []);
      const normalized = normalizeLogs(fresh);
      setLogs(normalized);
      const found = normalized.find((l) => String(l?.date || '').slice(0, 10) === dateISO || getYMDFromLog(l) === dateISO);
      return found?._id || null;
    } catch (err) {
      if (__DEV__) console.warn('[getIdForDate] fetch failed', err);
      return null;
    }
  };

  // confirm chung cho web & native
  function confirmDelete(message = 'Bạn có chắc muốn xoá nhật ký này?'): Promise<boolean> {
    if (Platform.OS === 'web') {
      // @ts-ignore
      return Promise.resolve((globalThis.confirm ?? window.confirm)(message));
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert('Xác nhận', message, [
        { text: 'Huỷ', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Xoá', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  }

  function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function within7Days(iso: string) {
    const now = new Date();
    const d = new Date(iso + 'T00:00:00');
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 6 && diff >= 0;
  }

  const weeklyEntries = entries
    .filter(e => within7Days(e.dateISO))
    .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  // Helpers
  const durationText = useMemo(() => {
    const mins = diffMinutes(bedTime, wakeTime);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }, [bedTime, wakeTime]);

  const toggleFactor = (k: string) =>
    setFactors((p) => ({ ...p, [k]: !p[k] }));

  const onSaveJournal = async () => {
  try {
    setLoading(true);
    
    // Validate sleepDate (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sleepDate)) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng nhập ngày dạng YYYY-MM-DD.');
      return;
    }

    const sendDate =
      crossesMidnight(bedTime, wakeTime) ? shiftYMD(sleepDate, -1) : sleepDate;

    const payload = {
      date: sendDate,                  
      sleepTime: bedTime,               
      wakeTime: wakeTime,              
      quality,                         
      wakeMood: moodMap[mood] || 'thu_gian',
      factors: selectedFactorsFromState(factors),
  notes: '',
    };

    console.log('[Sleep] payload gửi BE →', payload);

    try {
      await apiPost('/api/sleep/logs', payload);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || '';
      const status = e?.status || (typeof e?.code === 'number' ? e.code : undefined);
      if (String(status) === '409' || /409|trùng|Conflict/i.test(msg)) {
        const listRes = await apiGet('/api/sleep/logs?page=1&limit=1');
          const latest = normalizeLogs(listRes?.data || [])[0];
        if (latest?._id) {
          await apiPut(`/api/sleep/logs/${latest._id}`, {
            quality: payload.quality,
            wakeMood: payload.wakeMood,
            factors: payload.factors,
            notes: payload.notes,
          });
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  const listRes = await apiGet('/api/sleep/logs?page=1&limit=10');
  const freshLogs = normalizeLogs(listRes?.data || []);

    try {
      const mins = diffMinutes(bedTime, wakeTime);
      const newEntry = {
        dateISO: sendDate,
        bedTime,
        wakeTime,
        durationMin: mins,
        quality,
        mood,
        factors: Object.keys(factors).filter((k) => !!factors[k]),
      };

      setEntries((prev) => {
        const others = prev.filter((e) => e.dateISO !== sendDate);
        const next = [newEntry, ...others]
          .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1))
          .slice(0, 7);
        AsyncStorage.setItem('sleepJournal', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      if (__DEV__) console.warn('[Sleep] update local entries failed', err);
    }

  setLogs(freshLogs);
    Alert.alert('Thành công', 'Đã lưu nhật ký giấc ngủ!');
  } catch (e: any) {
    console.error('[Sleep] save error:', e);
    const msg = e?.data?.message || e?.message || 'Không thể lưu nhật ký.';
    Alert.alert('Lỗi', String(msg));
  } finally {
    setLoading(false);
  }
};

const handleDelete = async (logId: string, dateISO: string) => {
  console.log('[UI] handleDelete click:', { logId, dateISO }); 

  if (!logId) {
    Alert.alert('Lỗi', 'Không tìm thấy _id để xoá.');
    return;
  }

  try {
    const ok = await confirmDelete('Bạn có chắc muốn xoá nhật ký này?');
    if (!ok) return;
  } catch (e) {
    console.warn('[UI] confirmDelete failed:', e);
    return;
  }

  setDeletingId(logId);
  const snapshot = logs;
  setLogs((prev: any[]) => prev.filter((l) => l._id !== logId));

  try {
    await apiDelete(`/api/sleep/logs/${logId}`);

    const listRes = await apiGet('/api/sleep/logs?page=1&limit=10');
    setLogs(normalizeLogs(listRes?.data || []));

    setEntries((prev) => {
      const next = prev.filter((e) => e.dateISO !== dateISO);
      AsyncStorage.setItem('sleepJournal', JSON.stringify(next));
      return next;
    });

    Alert.alert('Đã xoá', 'Nhật ký đã được xoá.');
  } catch (err: any) {
    console.log('[UI] delete error:', err);
    // rollback nếu lỗi
    setLogs(snapshot);
    Alert.alert('Lỗi', err?.message || 'Không thể xoá nhật ký.');
  } finally {
    setDeletingId(null);
  }
};

  return (
    <YStack flex={1} backgroundColor={BG}>
      {/* Header */}
      <XStack alignItems="center" paddingHorizontal={16} paddingVertical={12}>
        <Button backgroundColor="transparent" height={36} width={36} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#111" />
        </Button>
        <Text fontSize={18} fontWeight="700" style={{ marginLeft: 8 }}>Sleep</Text>
        <XStack flex={1} />
        <Button backgroundColor="transparent" height={36} width={36}>
          <Ionicons name="moon-outline" size={20} color={PRIMARY} />
        </Button>
      </XStack>

      {/* Tabs */}
      <XStack paddingHorizontal={16} marginBottom={8} gap={8}>
        {[
          { key: 'journal', label: 'Nhật ký ngủ' },
          { key: 'support', label: 'Hỗ trợ ngủ' },
          { key: 'dreams', label: 'Giấc mơ' },
        ].map((t) => {
          const active = tab === (t.key as any);
          return (
            <Button
              key={t.key}
              flex={1}
              height={52}
              borderRadius={999}
              backgroundColor={active ? '#F3E8FF' : '#FFFFFF'}
              borderColor={active ? PRIMARY : '#E8ECF3'}
              borderWidth={1}
              onPress={() => setTab(t.key as any)}
            >
              <Text fontSize={14} color={active ? PRIMARY : '#6B6B6B'} fontWeight="600">
                {t.label}
              </Text>
            </Button>
          );
        })}
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        
        {/* ============= TAB 1: JOURNAL ============= */}
        {tab === 'journal' && (
          <YStack gap={16}>
            <Card
              padding={16}
              borderRadius={12}
              borderWidth={1}
              borderColor="#E8ECF3"
              backgroundColor="#FFFFFF"
            >
              <XStack alignItems="center" gap={8}>
                <Ionicons name="bed-outline" size={20} color={PRIMARY} />
                <Text fontSize={16} fontWeight="700">Thời gian ngủ hôm nay</Text>
              </XStack>
              {/* Sleep Date Input - test */}
              <YStack marginTop={12}>
                <Text fontSize={13} color="#6B6B6B">Ngày ghi nhật ký (test trong vòng 1 tuần)</Text>

                <XStack
                  alignItems="center"
                  height={52}
                  borderRadius={12}
                  borderWidth={1}
                  backgroundColor="#F8F8F8"
                  borderColor="#E4E4E4"
                  paddingHorizontal={12}
                  style={{ marginTop: 6 }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6B6B6B" />
                  <Input
                    flex={1}
                    height={52}
                    fontSize={16}
                    placeholder="yyyy-mm-dd (VD: 2025-11-27)"
                    value={sleepDate}
                    onChangeText={setSleepDate}
                    backgroundColor="transparent"
                    style={{ marginLeft: 8 }}
                  />
                </XStack>
              </YStack>

              {/* Bed / Wake rows */}
              <XStack marginTop={12} gap={12}>
                <YStack flex={1}>
                  <Text fontSize={13} color="#6B6B6B">Giờ đi ngủ</Text>
                  <XStack
                    alignItems="center"
                    height={52}
                    borderRadius={12}
                    borderWidth={1}
                    backgroundColor="#F8F8F8"
                    borderColor="#E4E4E4"
                    paddingHorizontal={12}
                    style={{ marginTop: 6 }}
                  >
                    <Ionicons name="time-outline" size={18} color="#6B6B6B" />
                    <Input
                      flex={1}
                      height={52}
                      fontSize={16}
                      placeholder="10:30 PM"
                      value={bedTime}
                      onChangeText={setBedTime}
                      backgroundColor="transparent"
                      style={{ marginLeft: 8 }}
                    />
                  </XStack>
                </YStack>

                <YStack flex={1}>
                  <Text fontSize={13} color="#6B6B6B">Giờ thức dậy</Text>
                  <XStack
                    alignItems="center"
                    height={52}
                    borderRadius={12}
                    borderWidth={1}
                    backgroundColor="#F8F8F8"
                    borderColor="#E4E4E4"
                    paddingHorizontal={12}
                    style={{ marginTop: 6 }}
                  >
                    <Ionicons name="alarm-outline" size={18} color="#6B6B6B" />
                    <Input
                      flex={1}
                      height={52}
                      fontSize={16}
                      placeholder="7:00 AM"
                      value={wakeTime}
                      onChangeText={setWakeTime}
                      backgroundColor="transparent"
                      style={{ marginLeft: 8 }}
                    />
                  </XStack>
                </YStack>
              </XStack>

              {/* Duration badge */}
              <YStack
                alignItems="center"
                justifyContent="center"
                height={44}
                borderRadius={10}
                backgroundColor="#F3E8FF"
                style={{ marginTop: 12 }}
              >
                <Text fontSize={15} fontWeight="700" color={PRIMARY}>{`Thời gian ngủ: ${durationText}`}</Text>
              </YStack>

              <Separator backgroundColor="#EEF1F6" style={{ marginVertical: 12 }} />

              {/* Rating */}
              <XStack alignItems="center" gap={8} style={{ marginTop: 12 }}>
                <Ionicons name="star-outline" size={20} color={PRIMARY} />
                <Text fontSize={13} color="#6B6B6B">Chất lượng giấc ngủ</Text>
              </XStack>
              <XStack alignItems="center" style={{ marginTop: 6 }}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const idx = i + 1;
                  const active = quality >= idx;
                  return (
                    <Button
                      key={idx}
                      backgroundColor="transparent"
                      height={36}
                      width={36}
                      onPress={() => setQuality(idx)}
                    >
                      <AntDesign name="star" size={20} color={active ? '#FFC107' : '#E0E0E0'} />
                    </Button>
                  );
                })}
              </XStack>

              {/* Mood */}
              <XStack alignItems="center" gap={8} style={{ marginTop: 12 }}>
                <Ionicons name="happy-outline" size={20} color={PRIMARY} />
                <Text fontSize={13} color="#6B6B6B">Tình trạng khi thức dậy</Text>
              </XStack>
              <XStack alignItems="center" flexWrap="wrap" style={{ marginTop: 6 }}>
                {(['😴', '😐', '😊','😫','😡','😭','🤩','😌','🤯'] as Mood[]).map((m) => (
                  <Button
                    key={m}
                    backgroundColor={mood === m ? '#FFF3CC' : '#FFFFFF'}
                    borderWidth={1}
                    borderColor="#E8ECF3"
                    height={40}
                    borderRadius={999}
                    paddingHorizontal={14}
                    onPress={() => setMood(m)}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  >
                    <Text fontSize={18}>{m}</Text>
                  </Button>
                ))}
              </XStack>

              {/* Factors */}
              <XStack alignItems="center" gap={8} style={{ marginTop: 12 }}>
                <Ionicons name="list-outline" size={20} color={PRIMARY} />
                <Text fontSize={13} color="#6B6B6B">Yếu tố ảnh hưởng</Text>
              </XStack>
              <XStack flexWrap="wrap" style={{ marginTop: 6 }}>
                {FACTORS.map((f) => {
                  const active = !!factors[f];
                  return (
                    <Button
                      key={f}
                      backgroundColor={active ? '#EEF0FF' : '#FFFFFF'}
                      borderWidth={1}
                      borderColor={active ? PRIMARY : '#E8ECF3'}
                      height={36}
                      borderRadius={999}
                      paddingHorizontal={12}
                      onPress={() => toggleFactor(f)}
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      <Text fontSize={13} color={active ? PRIMARY : '#111111'} fontWeight="600">
                        {f}
                      </Text>
                    </Button>
                  );
                })}
              </XStack>

              {/* Save */}
              <Button
                height={52}
                borderRadius={12}
                backgroundColor={PRIMARY}
                pressStyle={{ backgroundColor: PRIMARY_PRESSED }}
                onPress={onSaveJournal}
                style={{ marginTop: 12 }}
              >
                <Text fontSize={16} fontWeight="700" color="#FFFFFF">Lưu nhật ký ngủ</Text>
              </Button>
            </Card>

            {/* Tip banner */}
            <Card
              backgroundColor="#F3E8FF"
              borderWidth={1}
              borderColor="#E3D7FE"
              borderRadius={12}
              paddingHorizontal={16}
              paddingVertical={14}
            >
              <XStack alignItems="center">
                <Ionicons name="bulb-outline" size={20} color={PRIMARY_PRESSED} />
                <YStack style={{ marginLeft: 10 }}>
                  <Text fontSize={14} fontWeight="700" color="#1F1F1F">Mẹo ngủ ngon</Text>
                  <Text fontSize={13} color="#6B6B6B">
                    Tránh màn hình điện tử 1 giờ trước khi ngủ. Ánh sáng xanh có thể ảnh hưởng đến melatonin.
                  </Text>
                </YStack>
              </XStack>
            </Card>
            {/* BẢNG THỐNG KÊ 7 NGÀY */}
            <Card
              padding={16}
              borderRadius={16}
              borderWidth={1}
              borderColor="#E8ECF3"
              backgroundColor="#FFFFFF"
              style={{ marginTop: 12 }}
            >
              <XStack alignItems="center" gap={8} marginBottom={10}>
                <Ionicons name="analytics-outline" size={22} color={PRIMARY} />
                <Text fontSize={17} fontWeight="700" color="#1F1F1F">
                  Thống kê giấc ngủ · 7 ngày gần nhất
                </Text>
              </XStack>

              {/* Horizontal ScrollView for table */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <YStack>
                  {/* Header */}
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    backgroundColor="#F7F9FC"
                    paddingVertical={8}
                    paddingHorizontal={10}
                    borderRadius={10}
                    borderWidth={1}
                    borderColor="#E5E9F0"
                  >
                    <Text
                      fontSize={HEADER_FONT}
                      fontWeight="700"
                      color="#6B6B6B"
                      style={{ width: COL_DAY }}
                    >
                      Ngày
                    </Text>

                    <Text
                      fontSize={HEADER_FONT}
                      fontWeight="700"
                      color="#6B6B6B"
                      style={{ width: COL_TIME, textAlign: 'center' }}
                    >
                      Đi ngủ
                    </Text>

                    <Text
                      fontSize={HEADER_FONT}
                      fontWeight="700"
                      color="#6B6B6B"
                      style={{ width: COL_TIME, textAlign: 'center' }}
                    >
                      Thức dậy
                    </Text>

                    <Text
                      fontSize={HEADER_FONT}
                      fontWeight="700"
                      color="#6B6B6B"
                      style={{ width: COL_DURATION, textAlign: 'center' }}
                    >
                      Thời gian
                    </Text>

                    <Text
                      fontSize={HEADER_FONT}
                      fontWeight="700"
                      color="#6B6B6B"
                      style={{ width: COL_STAR, textAlign: 'center' }}
                    >
                      Sao
                    </Text>

                    <Text
                      fontSize={HEADER_FONT}
                      fontWeight="700"
                      color="#6B6B6B"
                      style={{ width: COL_MOOD, textAlign: 'right' }}
                    >
                      Mood
                    </Text>

                    <XStack style={{ width: 60 }} />
                  </XStack>

                  {/* Rows */}
                  {weeklyEntries.length === 0 ? (
                <Text
                  fontSize={13}
                  color="#6B6B6B"
                  textAlign="center"
                  marginTop={12}
                >
                  Chưa có dữ liệu trong 7 ngày gần nhất.  
                  Hãy bấm <Text fontWeight="700" color={PRIMARY}>“Lưu nhật ký ngủ”</Text>.
                </Text>
              ) : (
                weeklyEntries.map((e, index) => (
                  <XStack
                    key={e.dateISO}
                    alignItems="center"
                    justifyContent="space-between"
                    paddingVertical={12}
                    paddingHorizontal={10}
                    backgroundColor={index % 2 === 0 ? '#FFFFFF' : '#F9FBFF'}
                    borderBottomWidth={1}
                    borderColor="#EEF1F5"
                    borderRadius={index === weeklyEntries.length - 1 ? 10 : 0}
                  >
                      <Text fontSize={13} fontWeight="600" color="#1F1F1F" style={{ width: COL_DAY }}>
                        {formatVN(e.dateISO)}
                      </Text>
                      <Text fontSize={13} color="#333" style={{ width: COL_TIME, textAlign: 'center' }}>{e.bedTime}</Text>
                      <Text fontSize={13} color="#333" style={{ width: COL_TIME, textAlign: 'center' }}>{e.wakeTime}</Text>
                      <Text fontSize={13} color="#333" style={{ width: COL_DURATION, textAlign: 'center' }}>{fmtDuration(e.durationMin)}</Text>

                      <XStack style={{ width: COL_STAR, justifyContent: 'center' }} alignItems="center" gap={6}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <AntDesign
                            key={i}
                            name="star"
                            size={12}
                            color={i < e.quality ? '#FFC107' : '#E0E0E0'}
                          />
                        ))}
                      </XStack>

                      <Text fontSize={14} style={{ width: COL_MOOD, textAlign: 'right' }}>
                        {e.mood}
                      </Text>
                    <Button
                      backgroundColor="#FFEAEA"
                      disabled={deletingId === idByDate[e.dateISO]}
                      borderRadius={999}
                      paddingHorizontal={10}
                      height={26}
                      onPress={async () => {
                        try {
                          console.log('[UI] Click Xoá ngày:', e.dateISO);
                          // tìm _id tin cậy theo YMD
                          const id = await getIdForDate(e.dateISO);
                          console.log('[UI] Resolved _id:', id);
                          if (!id) {
                            Alert.alert(
                              'Không tìm thấy log để xoá',
                              'Hãy làm mới dữ liệu (ấn “Lưu nhật ký ngủ” để đồng bộ hoặc kéo xuống để tải lại).'
                            );
                            return;
                          }
                          // gọi flow xoá (đã có optimistic update)
                          await handleDelete(id, e.dateISO);
                        } catch (err: any) {
                          console.log('[UI] onPress delete error:', err);
                          Alert.alert('Lỗi', err?.message || 'Không thể xử lý yêu cầu xoá.');
                        }
                      }}
                    >
                      {deletingId === idByDate[e.dateISO]
                        ? <Text color="#9CA3AF" fontSize={12}>Đang xoá…</Text>
                        : <Text color="#E53935" fontSize={12}>Xoá</Text>
                      }
                    </Button>
                  </XStack>
                ))
                  )}
                </YStack>
              </ScrollView>
            </Card>
          </YStack>
        )}

        {/* ============= TAB 2: SUPPORT ============= */}
        {tab === 'support' && <SleepContent />}

        {/* ============= TAB 3: DREAMS ============= */}
        {tab === 'dreams' && <DreamsScreen />}
      </ScrollView>
    </YStack>
  );
}

/** Parse "HH:MM AM/PM" and get diff minutes from bed -> wake (wrap overnight) */
function diffMinutes(bed: string, wake: string) {
  const b = toMinutes(bed);
  const w = toMinutes(wake);
  const day = 24 * 60;
  const diff = (w - b + day) % day; // handle overnight
  return diff === 0 ? day : diff;   // treat same time as full day
}
function toMinutes(t: string) {
  // "10:30 PM" / "7:00 AM"
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && hh !== 12) hh += 12;
  if (ap === 'AM' && hh === 12) hh = 0;
  return hh * 60 + mm;
}
const formatMinutes = (m: number | null | undefined) => {
  if (m == null) return '—';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
};
function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function formatVN(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function labelMood(m: string) {
  switch (m) {
    case '😊': return 'Tích cực';
    case '😐': return 'Bình thường';
    case '😫': return 'Mệt mỏi';
    case '😴': return 'Buồn ngủ';
    case '🤩': return 'Hưng phấn';
    default: return '';
  }
}