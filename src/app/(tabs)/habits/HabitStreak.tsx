import React from 'react';
import { Stack, Link } from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { ChevronLeft, Flame, Calendar, TrendingUp } from 'lucide-react-native';
import {
  getHabits,
  getHabitStats,
  getHabitCalendar,
} from '../../../server/habits';

// Helper: flatten mọi style mảng -> object
const sx = (...styles: Array<StyleProp<ViewStyle | TextStyle | ImageStyle>>) =>
  StyleSheet.flatten(styles.filter(Boolean));

type Status = 'completed' | 'failed' | 'skipped' | 'none';

type HabitChip = {
  id: string | number;
  title: string;
  tag: string;
  tagColor: string;
};

type StatsState = {
  streak: number;
  bestStreak: number;
  completed: number;
  failed: number;
  skipped: number;
  total: number;
};

type CalendarMap = Record<number, Status>;

const monthNames = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];
const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const categoryMeta: Record<string, { tag: string; color: string }> = {
  health: { tag: 'Health', color: '#ec4899' },
  fitness: { tag: 'Energy', color: '#10b981' },
  learning: { tag: 'Learning', color: '#10b981' },
  mindful: { tag: 'Mindful', color: '#8b5cf6' },
  finance: { tag: 'Finance', color: '#10b981' },
  digital: { tag: 'Digital', color: '#6b7280' },
  social: { tag: 'Social', color: '#f59e0b' },
  control: { tag: 'Control', color: '#ef4444' },
  sleep: { tag: 'Sleep', color: '#8b5cf6' },
  energy: { tag: 'Energy', color: '#f59e0b' },
};

const CELL_PCT = '14.2857%';

export default function HabitStreak() {
  const [habits, setHabits] = React.useState<HabitChip[]>([]);
  const [selectedHabitId, setSelectedHabitId] = React.useState<
    string | number | null
  >(null);
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const [stats, setStats] = React.useState<StatsState>({
    streak: 0,
    bestStreak: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
  });

  const [calendarMap, setCalendarMap] = React.useState<CalendarMap>({});
  const [loadingHabits, setLoadingHabits] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  // ====== Helpers ngày tháng ======
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0=CN

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const changeMonth = (delta: number) => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const getStatusForDay = (day: number | null): Status => {
    if (!day) return 'none';
    return calendarMap[day] ?? 'none';
  };

  const getStatusColor = (status: Status, tagColor: string) => {
    switch (status) {
      case 'completed':
        return tagColor;
      case 'failed':
        return '#ef4444';
      case 'skipped':
        return '#f59e0b';
      default:
        return '#f3f4f6';
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'skipped':
        return '–';
      default:
        return '';
    }
  };

  // ====== Load danh sách habits ======
  React.useEffect(() => {
    const loadHabits = async () => {
      setLoadingHabits(true);
      try {
        const res: any = await getHabits();
        console.log('[HabitStreak] getHabits API:', res);
        const rawList: any[] = res?.habits || res?.data || res || [];

        const mapped: HabitChip[] = rawList
          .map((h) => {
            const id = h.id ?? h._id;
            if (!id) return null;

            const name = h.name ?? 'Thói quen không tên';
            const catKey = (h.category ?? '').toString().toLowerCase();
            const meta =
              categoryMeta[catKey] ?? { tag: 'Habit', color: '#6366f1' };

            return {
              id,
              title: name,
              tag: meta.tag,
              tagColor: meta.color,
            } as HabitChip;
          })
          .filter(Boolean) as HabitChip[];

        setHabits(mapped);
        if (mapped.length > 0) {
          setSelectedHabitId(mapped[0].id);
        }
      } catch (e) {
        console.error('[HabitStreak] getHabits error:', e);
      } finally {
        setLoadingHabits(false);
      }
    };

    loadHabits();
  }, []);

  // ====== Load stats + calendar theo habit + tháng ======
  React.useEffect(() => {
    if (!selectedHabitId) return;

    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const pad = (n: number) => String(n).padStart(2, '0');
        const from = `${year}-${pad(month)}-01`;
        const to = `${year}-${pad(month)}-${pad(daysInMonth)}`;
        console.log('range', from, to);

        const [statsRes, calRes]: any[] = await Promise.all([
          getHabitStats(selectedHabitId, { month, year }),
          getHabitCalendar(selectedHabitId, { month, year }),
        ]);
        console.log('data', statsRes?.data || statsRes);
        console.log('data2', calRes);

        // ---- map stats ----
        const s = statsRes?.data || statsRes || {};
        const streaks = s.streaks ?? {};
        const statsObj = s.stats ?? {};

        const streak =
          streaks.current ??
          streaks.streak ??
          0;
        const bestStreak =
          streaks.best ??
          0;
        const completed =
          statsObj.completedCount ??
          statsObj.completed ??
          0;
        const failed =
          statsObj.failedCount ??
          statsObj.failed ??
          0;
        const skipped =
          statsObj.skippedCount ??
          statsObj.skipped ??
          0;
        const total =
          statsObj.totalCount ??
          statsObj.total ??
          completed + failed + skipped;

        setStats({
          streak: Number(streak) || 0,
          bestStreak: Number(bestStreak) || 0,
          completed: Number(completed) || 0,
          failed: Number(failed) || 0,
          skipped: Number(skipped) || 0,
          total: Number(total) || 0,
        });

        // ---- map calendar ----
        const rawDays =
          calRes?.calendar?.days ??
          calRes?.calendar ??
          calRes?.days ??
          calRes?.data?.calendar?.days ??
          calRes?.data?.calendar ??
          [];

        const map: CalendarMap = {};

        if (Array.isArray(rawDays)) {
          rawDays.forEach((d: any) => {
            // d: { date: '2025-10-01', status: 'completed' } hoặc tương tự
            const dateStr: string = d.date ?? d.day ?? d.dateStr ?? '';
            const statusStr: string = (
              d.status ?? d.result ?? d.state ?? ''
            ).toLowerCase();
            if (!dateStr) return;

            const dt = new Date(dateStr);
            const day = dt.getDate();
            let st: Status = 'none';
            if (statusStr === 'completed' || statusStr === 'success')
              st = 'completed';
            else if (statusStr === 'failed' || statusStr === 'fail')
              st = 'failed';
            else if (statusStr === 'skipped' || statusStr === 'skip')
              st = 'skipped';

            if (day >= 1 && day <= daysInMonth) {
              map[day] = st;
            }
          });
        }

        setCalendarMap(map);
      } catch (e) {
        console.error('[HabitStreak] load detail error:', e);
        setStats({
          streak: 0,
          bestStreak: 0,
          completed: 0,
          failed: 0,
          skipped: 0,
          total: 0,
        });
        setCalendarMap({});
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedHabitId, currentDate, daysInMonth]);

  const habit = React.useMemo(() => {
    if (!habits.length) return null;
    const found = habits.find((h) => h.id === selectedHabitId);
    return found ?? habits[0];
  }, [habits, selectedHabitId]);

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const failedRate =
    stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={sx(styles.card, styles.header)}>
        <Link href="/(tabs)/habits" asChild>
          <Pressable style={styles.iconBtn}>
            <ChevronLeft size={20} color="#fff" />
          </Pressable>
        </Link>
        <View>
          <Text style={styles.headerTitle}>Chuỗi Thành Công</Text>
          <Text style={styles.headerSub}>Theo dõi chuỗi ngày liên tiếp</Text>
        </View>
      </View>

      {/* Nếu chưa có habits */}
      {habits.length === 0 && !loadingHabits ? (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            Bạn chưa có thói quen nào hoặc dữ liệu chưa sẵn sàng. Hãy tạo thói quen
            trước.
          </Text>
        </View>
      ) : !habit ? (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 14, color: '#6b7280' }}>
            Đang tải dữ liệu...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Habit selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hSelector}
          >
            {habits.map((h) => {
              const active = habit && habit.id === h.id;
              return (
                <TouchableOpacity
                  key={String(h.id)}
                  onPress={() => setSelectedHabitId(h.id)}
                  style={sx(styles.hChip, {
                    borderColor: active ? h.tagColor : '#e5e7eb',
                    backgroundColor: active ? '#00000008' : '#fff',
                  })}
                >
                  <Text
                    style={sx(styles.hChipText, {
                      color: active ? h.tagColor : '#6b7280',
                    })}
                  >
                    {h.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Loading detail hint */}
          {loadingDetail && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                Đang cập nhật dữ liệu...
              </Text>
            </View>
          )}

          {/* Main streak */}
          <View style={sx(styles.card, styles.centerCard)}>
            <View style={styles.streakRow}>
              <Flame size={32} color={habit.tagColor} />
              <Text
                style={sx(styles.streakNumber, { color: habit.tagColor })}
              >
                {stats.streak}
              </Text>
            </View>
            <Text style={styles.streakLabel}>Chuỗi Hiện Tại</Text>
            <Text style={styles.muted}>
              Chuỗi tốt nhất: {stats.bestStreak} ngày
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Hoàn Thành</Text>
                <Text style={sx(styles.statValue, { color: '#10b981' })}>
                  {stats.completed}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Thất Bại</Text>
                <Text style={sx(styles.statValue, { color: '#ef4444' })}>
                  {stats.failed}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Bỏ Qua</Text>
                <Text style={sx(styles.statValue, { color: '#f59e0b' })}>
                  {stats.skipped}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tổng</Text>
                <Text style={sx(styles.statValue, { color: '#6b7280' })}>
                  {stats.total}
                </Text>
              </View>
            </View>
          </View>

          {/* Calendar */}
          <View style={sx(styles.card, styles.section)}>
            <View style={styles.rowBetween}>
              <View style={styles.rowCenter}>
                <Calendar size={16} color="#0f172a" />
                <Text style={styles.monthTitle}>
                  {monthNames[currentDate.getMonth()]}{' '}
                  {currentDate.getFullYear()}
                </Text>
              </View>
              <View style={styles.rowCenter}>
                <Pressable style={styles.navBtn} onPress={() => changeMonth(-1)}>
                  <Text style={styles.navBtnText}>←</Text>
                </Pressable>
                <Pressable style={styles.navBtn} onPress={() => changeMonth(1)}>
                  <Text style={styles.navBtnText}>→</Text>
                </Pressable>
              </View>
            </View>

            {/* Day headers */}
            <View style={styles.weekRow}>
              {dayNames.map((d) => (
                <View key={d} style={styles.weekCell}>
                  <Text style={styles.weekText}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.gridWrap}>
              {calendarDays.map((day, idx) => {
                const status = getStatusForDay(day);
                const color = getStatusColor(status, habit.tagColor);
                const label = getStatusLabel(status);
                const isDay = !!day;

                return (
                  <View key={idx} style={styles.dayCellWrap}>
                    <View
                      style={sx(
                        styles.dayCircle,
                        { backgroundColor: isDay ? color : 'transparent' },
                        isDay &&
                          status === 'none' && { backgroundColor: '#f3f4f6' },
                      )}
                    >
                      {isDay && (
                        <>
                          <Text
                            style={sx(styles.dayLabel, {
                              color:
                                status === 'none' ? '#6b7280' : '#ffffff',
                            })}
                          >
                            {label}
                          </Text>
                          <Text
                            style={sx(styles.dayNum, {
                              color:
                                status === 'none' ? '#6b7280' : '#ffffff',
                            })}
                          >
                            {day}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={sx(styles.legendText, { color: '#10b981' })}>
                ✓ = Hoàn thành
              </Text>
              <Text style={sx(styles.legendText, { color: '#ef4444' })}>
                ✗ = Thất bại
              </Text>
              <Text style={sx(styles.legendText, { color: '#f59e0b' })}>
                – = Bỏ qua
              </Text>
              <Text style={sx(styles.legendText, { color: '#6b7280' })}>
                Trắng = Chưa ghi nhận
              </Text>
            </View>
          </View>

          {/* Summary */}
          <View style={sx(styles.card, styles.section)}>
            <View style={styles.rowCenter}>
              <TrendingUp size={16} color="#0f172a" />
              <Text style={styles.sumTitle}>Thống Kê Tổng</Text>
            </View>

            <View style={styles.twoGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tỷ Lệ Hoàn Thành</Text>
                <Text style={sx(styles.statValue, { color: '#10b981' })}>
                  {completionRate}%
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Tỷ Lệ Thất Bại</Text>
                <Text style={sx(styles.statValue, { color: '#ef4444' })}>
                  {failedRate}%
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer thay cho footer 10vh web */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginRight: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#9ca3af' },

  hSelector: { paddingHorizontal: 12, paddingVertical: 8 },
  hChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  hChipText: { fontSize: 13, fontWeight: '600' },

  centerCard: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 20,
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  streakNumber: { fontSize: 44, fontWeight: '800', marginLeft: 8 },
  streakLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#0f172a' },
  muted: { fontSize: 13, color: '#6b7280', marginBottom: 14 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    rowGap: 12,
  },
  statBox: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 12,
  },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },

  section: { marginHorizontal: 12, marginTop: 8, padding: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  monthTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },

  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  navBtnText: { fontSize: 16, color: '#374151', fontWeight: '700' },

  weekRow: { flexDirection: 'row', marginTop: 10 },
  weekCell: { width: CELL_PCT, alignItems: 'center', paddingVertical: 4 },
  weekText: { fontSize: 11, color: '#6b7280', fontWeight: '700' },

  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  dayCellWrap: { width: CELL_PCT, alignItems: 'center', marginVertical: 4 },
  dayCircle: {
    width: 40,
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { fontSize: 14, fontWeight: '800' },
  dayNum: { fontSize: 10, fontWeight: '700', marginTop: 1 },

  legend: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  legendText: { fontSize: 12, fontWeight: '700', marginBottom: 4 },

  sumTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  twoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
});
