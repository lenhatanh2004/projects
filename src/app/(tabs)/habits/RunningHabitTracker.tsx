// app/(tabs)/habits/RunningHabitTracker.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from 'react-native';
import {
  Plus,
  Bell,
  Target,
  Edit2,
  Trash2,
  Award,
  Flame,
  TrendingUp,
  ChevronLeft,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  getHabitReminders,
  createHabitReminder,
  updateHabitReminder,
  deleteHabitReminder,
  getHabitGoals,
  createHabitGoal,
  updateHabitGoal,
  deleteHabitGoal,
  getHabitStats,
} from '../../../server/habits';

type Reminder = {
  id: string;
  time: string;
  days: boolean[];
  enabled: boolean;
  note?: string;
};

type Challenge = {
  id: string;
  title: string;
  goal: number;
  current: number;
  icon: string;
  note: string;
};

type HabitStats = {
  currentStreak: number;
  bestStreak: number;
  successRate: number; // %
};

const GOAL_EMOJIS = [
  '🎯','🔥','🏆','🥇','🥈','🥉','⭐','🌟','💫','🚩','🏁','⛳️','🎖️','🏅',
  '⛰️','🏔️','🚀','🧭','🗺️','🪜'
];

const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const ModalSheet: React.FC<ModalSheetProps> = ({ visible, onClose, title, children }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
        </View>
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const HabitTracker: React.FC = () => {
  const { habitId } = useLocalSearchParams<{ habitId?: string }>();

  const [activeTab, setActiveTab] = useState<'info' | 'reminders' | 'goals'>('info');

  // ====== STATE ======
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [habitStats, setHabitStats] = useState<HabitStats>({
    currentStreak: 7,
    bestStreak: 45,
    successRate: 85,
  });

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [newReminder, setNewReminder] = useState<Reminder>({
    id: Date.now().toString(),
    time: '07:00',
    days: [false, false, false, false, false, false, false],
    enabled: true,
    note: '',
  });

  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Challenge | null>(null);
  const [newGoal, setNewGoal] = useState<Challenge>({
    id: Date.now().toString(),
    title: '',
    goal: 30,
    current: 0,
    icon: '🏃‍♂️',
    note: '',
  });

  // Custom confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // ====== HELPERS MAP DỮ LIỆU API → UI ======
  const normalizeReminder = (r: any): Reminder => {
    const id = String(r.id ?? r._id ?? Date.now());
    const timeRaw: string = r.time ?? r.remindAt ?? '07:00';
    const time = timeRaw.slice(0, 5); // HH:MM

    let days: boolean[] = [false, false, false, false, false, false, false];
    const rawDays = r.days ?? r.daysOfWeek;
    if (Array.isArray(rawDays)) {
      if (rawDays.length === 7 && typeof rawDays[0] === 'boolean') {
        days = rawDays;
      } else if (rawDays.length && typeof rawDays[0] === 'number') {
        days = days.map((_, i) => {
          const dayNumber = i === 6 ? 0 : i + 1; // API: 0 = CN, 1 = T2, ...
          return rawDays.includes(dayNumber);
        });
      }
    }

    const enabled: boolean = r.enabled ?? r.isActive ?? r.soundEnabled ?? r.vibrationEnabled ?? true;
    const note: string = r.note ?? r.description ?? r.message ?? '';

    return { id, time, days, enabled, note };
  };

  const normalizeGoal = (g: any): Challenge => {
    const id = String(g.id ?? g._id ?? Date.now());
    const title: string = g.title ?? g.name ?? 'Mục tiêu';
    const goal: number = Number(
      g.goal ??
      g.target ??
      g.targetDays ??
      30
    ) || 0;
    const current: number = Number(
      g.current ??
      g.progress ??
      g.completedDays ??
      0
    ) || 0;
    const icon: string = g.icon ?? '🎯';
    const note: string = g.note ?? g.description ?? '';

    return { id, title, goal, current, icon, note };
  };

  // ====== LOAD DATA TỪ API ======
  useEffect(() => {
    if (!habitId) return;

    let cancelled = false;

    const loadReminders = async () => {
      try {
        const res: any = await getHabitReminders(habitId as string);
        const list: any[] = res?.reminders ?? res?.data ?? res ?? [];
        if (!cancelled) {
          setReminders(list.map(normalizeReminder));
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitReminders error:', e);
      }
    };

    const loadGoals = async () => {
      try {
        const res: any = await getHabitGoals(habitId as string, 'active');
        const list: any[] = res?.goals ?? res?.data ?? res ?? [];
        if (!cancelled) {
          setChallenges(list.map(normalizeGoal));
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitGoals error:', e);
      }
    };

    const loadStats = async () => {
      try {
        const res: any = await getHabitStats(habitId as string, {});
        const habit = res?.data?.habit ?? res?.habit;
        const statsRoot = res?.data ?? res ?? {};
        const s = statsRoot.stats ?? statsRoot;

        const habitName = habit?.name ?? '';
        const freqRaw = habit?.frequency ?? '';

        const freqLabel = (() => {
          switch (freqRaw) {
            case 'daily':
              return 'HÀNG NGÀY';
            case 'weekly':
              return 'HÀNG TUẦN';
            case 'monthly':
              return 'HÀNG THÁNG';
            default:
              return 'HÀNG NGÀY';
          }
        })();

        if (!cancelled) {
          setName(habitName);
          setFrequency(freqLabel);
        }

        const completed = Number(s?.completedCount ?? s?.completed ?? 0) || 0;
        const failed = Number(s?.failedCount ?? s?.failed ?? 0) || 0;
        const skipped = Number(s?.skippedCount ?? s?.skipped ?? 0) || 0;
        const total = Number(s?.totalCount ?? s?.total ?? completed + failed + skipped) || 0;

        const streaks = statsRoot.streaks ?? {};
        const currentStreak = Number(streaks.current ?? statsRoot.currentStreak ?? 0) || 0;
        const bestStreak =
          Number(streaks.best ?? statsRoot.longestStreak ?? currentStreak) || 0;

        let successRate = 0;
        if (Number.isFinite(statsRoot.successRate)) {
          successRate = Number(statsRoot.successRate);
        } else if (total > 0) {
          successRate = (completed / total) * 100;
        }

        if (!cancelled) {
          setHabitStats({
            currentStreak,
            bestStreak,
            successRate: Math.round(successRate),
          });
        }
      } catch (e) {
        console.error('[HabitTracker] getHabitStats error:', e);
      }
    };

    loadReminders();
    loadGoals();
    loadStats();

    return () => {
      cancelled = true;
    };
  }, [habitId]);

  const refetchAll = useCallback(async () => {
    if (!habitId) return;
    try {
      const [r, g, s]: any[] = await Promise.all([
        getHabitReminders(habitId as string),
        getHabitGoals(habitId as string, 'active'),
        getHabitStats(habitId as string, {}),
      ]);
      const rlist: any[] = r?.reminders ?? r?.data ?? r ?? [];
      setReminders(rlist.map(normalizeReminder));
      const glist: any[] = g?.goals ?? g?.data ?? g ?? [];
      setChallenges(glist.map(normalizeGoal));

      const statsRoot = s?.data ?? s ?? {};
      const habit = statsRoot.habit;
      if (habit) {
        const freqLabel = (() => {
          switch (habit.frequency) {
            case 'daily':
              return 'HÀNG NGÀY';
            case 'weekly':
              return 'HÀNG TUẦN';
            case 'monthly':
              return 'HÀNG THÁNG';
            default:
              return 'HÀNG NGÀY';
          }
        })();
        setName(habit.name ?? '');
        setFrequency(freqLabel);
      }

      const stats = statsRoot.stats ?? statsRoot;
      const completed = Number(stats?.completedCount ?? stats?.completed ?? 0) || 0;
      const failed = Number(stats?.failedCount ?? stats?.failed ?? 0) || 0;
      const skipped = Number(stats?.skippedCount ?? stats?.skipped ?? 0) || 0;
      const total = Number(stats?.totalCount ?? stats?.total ?? completed + failed + skipped) || 0;

      const streaks = statsRoot.streaks ?? {};
      const currentStreak = Number(streaks.current ?? statsRoot.currentStreak ?? 0) || 0;
      const bestStreak = Number(streaks.best ?? statsRoot.longestStreak ?? currentStreak) || 0;

      let successRate = 0;
      if (Number.isFinite(statsRoot.successRate)) successRate = Number(statsRoot.successRate);
      else if (total > 0) successRate = (completed / total) * 100;

      setHabitStats({ currentStreak, bestStreak, successRate: Math.round(successRate) });
    } catch (e) {
      console.error('[HabitTracker] refetchAll error:', e);
    }
  }, [habitId]);

  // ====== UPDATE FIELD LOCAL ======
  const updateReminderField = useCallback((field: keyof Reminder, value: any) => {
    setNewReminder(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateGoalField = useCallback((field: keyof Challenge, value: any) => {
    setNewGoal(prev => ({ ...prev, [field]: value }));
  }, []);

  const openConfirm = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const buildReminderPayload = (reminder: Reminder) => {
    const dayNumbers = Array.isArray(reminder.days)
      ? reminder.days.reduce<number[]>((acc, active, idx) => {
          if (active) acc.push(idx === 6 ? 0 : idx + 1); // API expects 0=CN, 1=T2
          return acc;
        }, [])
      : [];

    const time = (reminder.time || '').slice(0, 5) || '07:00';
    const message = reminder.note && reminder.note.trim().length > 0 ? reminder.note : 'đến giờ';

    return {
      time,
      days: dayNumbers,
      soundEnabled: reminder.enabled,
      message,
      vibrationEnabled: reminder.enabled,
    };
  };

  // ====== SAVE / DELETE REMINDER (API) ======
  const resetReminderForm = () => {
    setEditingReminder(null);
    setNewReminder({
      id: Date.now().toString(),
      time: '07:00',
      days: [false, false, false, false, false, false, false],
      enabled: true,
      note: '',
    });
  };

  const handleSaveReminder = async () => {
    try {
      const payload: any = buildReminderPayload(newReminder);

      if (habitId) {
        if (editingReminder) {
          await updateHabitReminder(habitId as string, editingReminder.id, payload);
          await refetchAll();
        } else {
          await createHabitReminder(habitId as string, payload);
          await refetchAll();
        }
      } else {
        // fallback local nếu chưa có habitId (giữ logic giống FE)
        if (editingReminder) {
          setReminders(prev =>
            prev.map(r => (r.id === editingReminder.id ? { ...newReminder } : r)),
          );
        } else {
          setReminders(prev => [...prev, { ...newReminder, id: Date.now().toString() }]);
        }
      }
    } catch (e) {
      console.error('[HabitTracker] saveReminder error:', e);
    } finally {
      setShowReminderModal(false);
      resetReminderForm();
    }
  };

  const toggleReminderEnabled = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (!target) return;

    const updated = { ...target, enabled: !target.enabled };
    setReminders(prev => prev.map(r => (r.id === id ? updated : r)));

    if (habitId) {
      try {
        const payload: any = buildReminderPayload(updated);
        await updateHabitReminder(habitId as string, id, payload);
        await refetchAll();
      } catch (e) {
        console.error('[HabitTracker] toggleReminderEnabled error:', e);
      }
    }
  };

  // ====== SAVE / DELETE GOAL (API) ======
  const resetGoalForm = () => {
    setEditingGoal(null);
    setNewGoal({
      id: Date.now().toString(),
      title: '',
      goal: 30,
      current: 0,
      icon: '🏃‍♂️',
      note: '',
    });
  };

  const handleSaveGoal = async () => {
    try {
      if (!habitId) {
        if (editingGoal) {
          setChallenges(prev =>
            prev.map(c => (c.id === editingGoal.id ? { ...newGoal } : c)),
          );
        } else {
          setChallenges(prev => [...prev, { ...newGoal, id: Date.now().toString() }]);
        }
        setShowGoalModal(false);
        resetGoalForm();
        return;
      }

      const isUpdate = !!editingGoal;

      if (isUpdate) {
        const payload: any = {
          target: Number(newGoal.goal) || undefined,
          current: Number(newGoal.current) || undefined,
          description: newGoal.title || undefined,
          reward: newGoal.note || undefined,
        };
        await updateHabitGoal(habitId as string, editingGoal!.id, payload);
        await refetchAll();
      } else {
        const payload: any = {
          type: 'total_completions',
          target: Math.max(1, Number(newGoal.goal) || 1),
          description: newGoal.title || '',
          reward: newGoal.note || '',
        };
        await createHabitGoal(habitId as string, payload);
        await refetchAll();
      }
    } catch (e) {
      console.error('[HabitTracker] saveGoal error:', e);
    } finally {
      setShowGoalModal(false);
      resetGoalForm();
    }
  };

  // ====== UI COMPONENTS CON ======
  const StatCards: React.FC<{ stats: HabitStats }> = ({ stats }) => (
    <View style={styles.statCards}>
      <View style={[styles.statCard, styles.statCardRose]}>
        <View style={[styles.statCardCircle, styles.statCardCircleRose]} />
        <Flame size={24} color="#f43f5e" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <Text style={styles.statNumber}>{stats.currentStreak}</Text>
        <Text style={styles.statSub}>Streak hiện tại</Text>
      </View>
      <View style={[styles.statCard, styles.statCardAmber]}>
        <View style={[styles.statCardCircle, styles.statCardCircleAmber]} />
        <Award size={24} color="#d97706" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <Text style={styles.statNumber}>{stats.bestStreak}</Text>
        <Text style={styles.statSub}>Kỷ lục cao nhất</Text>
      </View>
      <View style={[styles.statCard, styles.statCardTeal]}>
        <View style={[styles.statCardCircle, styles.statCardCircleTeal]} />
        <TrendingUp size={24} color="#0d9488" strokeWidth={2.5} style={{ marginBottom: 8 }} />
        <Text style={styles.statNumber}>{Math.round(stats.successRate)}%</Text>
        <Text style={styles.statSub}>Tỷ lệ thành công</Text>
      </View>
    </View>
  );

  const ReminderList = () => (
    <View style={styles.list}>
      {reminders.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardLeft}>
              <LinearGradient
                colors={r.enabled ? ['#7c3aed', '#6d28d9'] : ['#cbd5e1', '#94a3b8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                <Bell color="#fff" size={20} strokeWidth={2.5} />
              </LinearGradient>
              <View>
                <Text style={styles.timeText}>{r.time}</Text>
                <Text
                  style={[
                    styles.statusText,
                    r.enabled ? styles.statusOn : styles.statusOff,
                  ]}
                >
                  {r.enabled ? 'Đang hoạt động' : 'Đã tạm dừng'}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingReminder(r);
                  setNewReminder(r);
                  setShowReminderModal(true);
                }}
                style={[styles.iconAction, styles.iconActionEdit]}
              >
                <Edit2 color="#8b5cf6" size={16} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  openConfirm('Bạn có chắc muốn xóa nhắc nhở này?', async () => {
                    if (habitId) {
                      try {
                        await deleteHabitReminder(habitId as string, r.id);
                      } catch (e) {
                        console.error('[HabitTracker] deleteReminder error:', e);
                      }
                    }
                    await refetchAll();
                  })
                }
                style={[styles.iconAction, styles.iconActionDelete]}
              >
                <Trash2 color="#f43f5e" size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View>
              <Text style={styles.sectionLabel}>Lặp lại theo ngày</Text>
              <View style={styles.dayRow}>
                {r.days.map((a, i) => (
                  <View
                    key={i}
                    style={[styles.dayPill, a && styles.dayPillActive]}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        a && styles.dayPillTextActive,
                      ]}
                    >
                      {dayNames[i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {!!r.note && r.note.trim().length > 0 && (
              <View>
                <Text style={styles.goalNote}>{r.note}</Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.sectionLabel}>Trạng thái thông báo</Text>
              <Pressable
                onPress={() => toggleReminderEnabled(r.id)}
                style={[
                  styles.toggle,
                  r.enabled && styles.toggleOn,
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    r.enabled && styles.toggleKnobOn,
                  ]}
                >
                  {r.enabled && (
                    <Check size={14} color="#7c3aed" strokeWidth={3} />
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const GoalList = () => (
    <View style={styles.list}>
      {challenges.map((c) => {
        const progress = c.goal > 0 ? Math.max(0, Math.min(100, (c.current / c.goal) * 100)) : 0;
        return (
          <View key={c.id} style={[styles.card, styles.goalCard]}>
            <View style={styles.cardHead}>
              <View style={styles.cardLeft}>
                <Text style={styles.emoji}>{c.icon}</Text>
                <View>
                  <Text style={styles.goalTitle}>{c.title}</Text>
                  <Text style={styles.goalNote}>{c.note}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingGoal(c);
                    setNewGoal(c);
                    setShowGoalModal(true);
                  }}
                  style={[styles.iconAction, styles.iconActionEdit]}
                >
                  <Edit2 color="#d946ef" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    openConfirm('Bạn có muốn xóa mục tiêu này?', async () => {
                      if (habitId) {
                        try {
                          await deleteHabitGoal(habitId as string, c.id);
                        } catch (e) {
                          console.error('[HabitTracker] deleteGoal error:', e);
                        }
                      }
                      setChallenges(prev => prev.filter(x => x.id !== c.id));
                    })
                  }
                  style={[styles.iconAction, styles.iconActionDelete]}
                >
                  <Trash2 color="#f43f5e" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.progressHead}>
                <Text style={styles.sectionLabel}>Tiến độ hoàn thành</Text>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#d946ef', '#ec4899', '#f43f5e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <View style={styles.progressFoot}>
                <Text style={styles.goalCompleted}>Đã hoàn thành</Text>
                <Text style={styles.goalCount}>
                  <Text style={styles.accent}>{c.current}</Text> / {c.goal} ngày
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  // ====== UI ======
  return (
    <SafeAreaView style={styles.page}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.topbarInner}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits')}
              style={styles.backBtn}
            >
              <ChevronLeft size={18} strokeWidth={2.5} color="#475569" />
            </TouchableOpacity>

            <LinearGradient
              colors={['#7c3aed', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.appBadge}
            >
              <Target color="#fff" size={22} strokeWidth={2.5} />
            </LinearGradient>

            <View>
              <Text style={styles.appTitle}>FlowState</Text>
              <Text style={styles.appSubtitle}>Habit Tracking System</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['info', 'reminders', 'goals'] as const).map((t) => {
              const isActive = activeTab === t;
              const label =
                t === 'info' ? 'Tổng quan' : t === 'reminders' ? 'Nhắc nhở' : 'Mục tiêu';
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setActiveTab(t)}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'info' && (
          <>
            <Text style={styles.sectionTitle}>Tổng quan</Text>

            {/* Hero */}
            <LinearGradient
              colors={['#7c3aed', '#9333ea', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View>
                <Text style={styles.heroEyebrow}>THÓI QUEN {frequency}</Text>
                <Text style={styles.heroTitle}>{name}</Text>
                <Text style={styles.heroSubtitle}>
                  Gieo nhịp từng bước - Kỷ luật {frequency}
                </Text>

                <View style={styles.heroStats}>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatLabel}>Tần suất</Text>
                    <Text style={styles.heroStatValue}>{frequency}</Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatLabel}>Mục tiêu</Text>
                    <Text style={styles.heroStatValue}>{name}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            <StatCards stats={habitStats} />
          </>
        )}

        {activeTab === 'reminders' && (
          <>
            <View style={styles.sectionHead}>
              <TouchableOpacity
                onPress={() => setActiveTab('info')}
                style={styles.backInlineBtn}
              >
                <ChevronLeft size={18} strokeWidth={2.5} color="#475569" />
                <Text style={styles.backInlineText}>Quay lại</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Nhắc nhở</Text>

              <TouchableOpacity
                onPress={() => {
                  setEditingReminder(null);
                  resetReminderForm();
                  setShowReminderModal(true);
                }}
                style={[styles.iconBtn, styles.iconBtnViolet]}
              >
                <Plus size={20} strokeWidth={2.5} color="#fff" />
              </TouchableOpacity>
            </View>

            <ReminderList />
          </>
        )}

        {activeTab === 'goals' && (
          <>
            <View style={styles.sectionHead}>
              <TouchableOpacity
                onPress={() => setActiveTab('info')}
                style={styles.backInlineBtn}
              >
                <ChevronLeft size={18} strokeWidth={2.5} color="#475569" />
                <Text style={styles.backInlineText}>Quay lại</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Mục tiêu</Text>

              <TouchableOpacity
                onPress={() => {
                  setEditingGoal(null);
                  resetGoalForm();
                  setShowGoalModal(true);
                }}
                style={[styles.iconBtn, styles.iconBtnPink]}
              >
                <Plus size={20} strokeWidth={2.5} color="#fff" />
              </TouchableOpacity>
            </View>

            <GoalList />
          </>
        )}
      </ScrollView>

      {/* Reminder Modal */}
      <ModalSheet
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setEditingReminder(null);
        }}
        title={editingReminder ? 'Chỉnh sửa nhắc nhở' : 'Thêm nhắc nhở mới'}
      >
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Thời gian</Text>
            <TextInput
              value={newReminder.time}
              onChangeText={(text) => updateReminderField('time', text)}
              style={[styles.input, styles.inputTime]}
              placeholder="07:00"
              keyboardType="numeric"
            />
          </View>

          <View>
            <Text style={styles.label}>Lặp lại theo ngày</Text>
            <View style={styles.dayGrid}>
              {dayNames.map((d, i) => {
                const active = newReminder.days[i];
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      const ds = [...newReminder.days];
                      ds[i] = !ds[i];
                      updateReminderField('days', ds);
                    }}
                    style={[
                      styles.daySquare,
                      active && styles.daySquareActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.daySquareText,
                        active && styles.daySquareTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              value={newReminder.note || ''}
              onChangeText={(text) => updateReminderField('note', text)}
              style={styles.textarea}
              placeholder="Thêm ghi chú cho nhắc nhở..."
              multiline
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={() => {
                setShowReminderModal(false);
                setEditingReminder(null);
              }}
              style={styles.btnOutline}
            >
              <Text style={styles.btnOutlineText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveReminder}
              style={[styles.btnSolid, styles.btnSolidViolet]}
            >
              <Text style={styles.btnSolidText}>Lưu lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* Goal Modal */}
      <ModalSheet
        visible={showGoalModal}
        onClose={() => {
          setShowGoalModal(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Chỉnh sửa mục tiêu' : 'Thêm mục tiêu mới'}
      >
        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              value={newGoal.title}
              onChangeText={(text) => updateGoalField('title', text)}
              style={styles.input}
              placeholder="VD: Thử thách 30 ngày"
            />
          </View>

          <View>
            <Text style={styles.label}>Biểu tượng</Text>
            <View style={styles.emojiGrid}>
              {GOAL_EMOJIS.map((emo) => {
                const isSelected = newGoal.icon === emo;
                return (
                  <TouchableOpacity
                    key={emo}
                    style={[
                      styles.emojiCell,
                      isSelected && styles.emojiCellSelected,
                    ]}
                    onPress={() => updateGoalField('icon', emo)}
                  >
                    <Text style={styles.emojiCellText}>{emo}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGrid}>
            <View>
              <Text style={styles.label}>Mục tiêu (ngày)</Text>
              <TextInput
                value={String(newGoal.goal)}
                onChangeText={(text) =>
                  updateGoalField('goal', parseInt(text || '0', 10) || 0)
                }
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
            <View>
              <Text style={styles.label}>Hiện tại</Text>
              <TextInput
                value={String(newGoal.current)}
                onChangeText={(text) =>
                  updateGoalField('current', parseInt(text || '0', 10) || 0)
                }
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              value={newGoal.note || ''}
              onChangeText={(text) => updateGoalField('note', text)}
              style={styles.textarea}
              placeholder="Thêm mô tả cho mục tiêu của bạn..."
              multiline
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              onPress={() => {
                setShowGoalModal(false);
                setEditingGoal(null);
              }}
              style={styles.btnOutline}
            >
              <Text style={styles.btnOutlineText}>Hủy bỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveGoal}
              style={[styles.btnSolid, styles.btnSolidPink]}
            >
              <Text style={styles.btnSolidText}>Lưu lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>

      {/* Confirm Modal */}
      <ModalSheet
        visible={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        title="Xác nhận"
      >
        <View style={styles.form}>
          <Text style={styles.confirmMessage}>{confirmMessage}</Text>
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.btnOutline}
              onPress={() => {
                setConfirmOpen(false);
                setConfirmAction(null);
              }}
            >
              <Text style={styles.btnOutlineText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSolid, styles.btnSolidPink]}
              onPress={() => {
                if (confirmAction) confirmAction();
                setConfirmOpen(false);
                setConfirmAction(null);
              }}
            >
              <Text style={styles.btnSolidText}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
};

export default HabitTracker;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  /* Topbar */
  topbar: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 40,
  },
  topbarInner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  backBtn: {
    marginRight: 8,
    padding: 6,
    borderRadius: 999,
  },
  appBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  /* Tabs */
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    borderRadius: 16,
    padding: 6,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabActive: {
    backgroundColor: '#7c3aed',
    borderColor: 'transparent',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  tabTextActive: {
    color: '#fff',
  },

  /* Content */
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  /* Hero */
  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 5,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#E9D5FF',
    fontSize: 14,
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroStatLabel: {
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  /* Stat cards */
  statCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardRose: {
    backgroundColor: '#fff0f4',
    borderColor: 'rgba(251,113,133,0.4)',
  },
  statCardAmber: {
    backgroundColor: '#fff7ed',
    borderColor: 'rgba(251,191,36,0.4)',
  },
  statCardTeal: {
    backgroundColor: '#ecfeff',
    borderColor: 'rgba(45,212,191,0.4)',
  },
  statCardCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -16,
    right: -16,
  },
  statCardCircleRose: {
    backgroundColor: 'rgba(251,113,133,0.08)',
  },
  statCardCircleAmber: {
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  statCardCircleTeal: {
    backgroundColor: 'rgba(13,148,136,0.08)',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(71,85,105,0.8)',
  },

  /* List & cards */
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  goalCard: {},
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  statusOn: {
    color: '#7c3aed',
  },
  statusOff: {
    color: '#94a3b8',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconAction: {
    padding: 8,
    borderRadius: 10,
  },
  iconActionEdit: {
    backgroundColor: 'transparent',
  },
  iconActionDelete: {
    backgroundColor: 'transparent',
  },
  cardBody: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: 'transparent',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
  },
  dayPillTextActive: {
    color: '#fff',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },

  /* Toggle */
  toggle: {
    width: 56,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#7c3aed',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },

  /* Goals */
  emoji: {
    fontSize: 32,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  goalNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercent: {
    fontWeight: '800',
    fontSize: 13,
    color: '#ec4899',
  },
  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  goalCompleted: {
    fontSize: 12,
    color: '#64748b',
  },
  goalCount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  accent: {
    color: '#d946ef',
  },

  /* Section head */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backInlineText: {
    color: '#475569',
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnViolet: {
    backgroundColor: '#7c3aed',
  },
  iconBtnPink: {
    backgroundColor: '#d946ef',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 6,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 12,
  },

  /* Form */
  form: {
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputTime: {},
  textarea: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontWeight: '600',
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#0f172a',
  },
  formGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
  },
  btnOutline: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineText: {
    fontWeight: '800',
    color: '#334155',
  },
  btnSolid: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  btnSolidViolet: {
    backgroundColor: '#7c3aed',
  },
  btnSolidPink: {
    backgroundColor: '#d946ef',
  },
  btnSolidText: {
    fontWeight: '800',
    color: '#fff',
  },

  /* Emoji grid */
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellSelected: {
    borderColor: '#d946ef',
    shadowColor: '#d946ef',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  emojiCellText: {
    fontSize: 22,
  },

  /* Day picker in modal */
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  daySquare: {
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySquareActive: {
    backgroundColor: '#7c3aed',
    borderColor: 'transparent',
  },
  daySquareText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
  },
  daySquareTextActive: {
    color: '#fff',
  },
});
