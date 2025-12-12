import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Target, Check, TrendingUp } from 'lucide-react-native';

// 🔗 NỐI API
import {
  recommendHabits,
  getQuestionSurvey,
  submitSurvey,
  createHabit,
} from '../../../server/habits';

// ===== Types cho UI =====
type Option = { value: number; label: string; emoji?: string };

type SurveyQuestion = {
  id: string;
  category: string;
  title: string;
  options: Option[];
};

// ===== Types dạng BE trả về =====
type BEOption = { id: string; text: string; value: number };

type BEQuestion = {
  id: string;
  text: string;
  type: string;
  category: string;
  options: BEOption[];
};

type SurveySessionResponse = {
  success: boolean;
  sessionId: string;
  questions: BEQuestion[];
  totalQuestions: number;
  strategy: string;
  answeredCount: number;
  isCompleted: boolean;
  createdAt: string;
  message?: string;
};

type UserInfo = {
  name?: string;
  age?: number;
  ageGroup?: string;
  ageGroupCode?: string;
  gender?: string;
  genderCode?: string;
};

// Gợi ý thói quen
type Suggestion = {
  id?: string;
  _id?: string;
  name: string;
  title: string;
  description: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  time: string;
  category: 'mindful' | 'energy' | 'sleep' | 'productivity' | 'social' | 'personal';
  score: number;
};

// Map category slug -> nhãn đẹp
const CATEGORY_LABELS: Record<string, string> = {
  digital: 'Digital',
  learning: 'Học tập',
  sleep: 'Giấc ngủ',
  energy: 'Năng lượng',
  social: 'Cộng đồng',
  productivity: 'Hiệu suất',
  fitness: 'Vận động',
  health: 'Sức khỏe',
  mindful: 'Tâm trí',
  control: 'Kỷ luật',
};

type ViewMode = 'survey' | 'summary' | 'suggestions';

const defaultDomainScores = {
  mental: 60,
  physical: 60,
  social: 60,
  personal: 60,
};

export default function HabitSurveyMobile() {
  // ================== STATE CHUNG ==================
  const [view, setView] = useState<ViewMode>('survey');

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [idx, setIdx] = useState(0);

  // ✅ answers: questionId -> numeric value (1–4)
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = questions.length;
  const current = total > 0 ? questions[idx] : undefined;
  const progress = useMemo(
    () => (total > 0 ? Math.round(((idx + 1) / total) * 100) : 0),
    [idx, total],
  );
  const selectedOptionValue = current ? answers[current.id] : undefined;

  // ================== STATE GỢI Ý THÓI QUEN ==================
  const [domainScores, setDomainScores] = useState(defaultDomainScores);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Record<string, boolean>>({});
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const selectedCount = useMemo(
    () => Object.values(selectedHabits).filter(Boolean).length,
    [selectedHabits],
  );

  // ================== LOAD CÂU HỎI TỪ BE ==================
  useEffect(() => {
    let cancelled = false;

    const fetchQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        setErrorMsg(null);

        const res: SurveySessionResponse | any = await getQuestionSurvey();
        console.log('[HabitSurvey] getQuestionSurvey response:', res);

        if (cancelled) return;

        if (res?.success && Array.isArray(res.questions)) {
          const beQuestions: BEQuestion[] = res.questions;

          if (res.sessionId) {
            setSessionId(res.sessionId);
          }

          const normalized: SurveyQuestion[] = beQuestions.map((q) => ({
            id: q.id,
            title: q.text,
            category: CATEGORY_LABELS[q.category] ?? q.category,
            options: (q.options || []).map((opt) => ({
              value: opt.value,
              label: opt.text,
            })),
          }));

          if (normalized.length > 0) {
            setQuestions(normalized);
            setIdx(0);
            setAnswers({});
            setDone(false);
            setView('survey');
            return;
          }
        }

        // Nếu response không hợp lệ hoặc không có câu hỏi
        setErrorMsg('Không tải được bộ câu hỏi khảo sát. Vui lòng thử lại sau.');
      } catch (err) {
        console.error('[HabitSurvey] getQuestionSurvey error:', err);
        if (!cancelled) {
          setErrorMsg('Có lỗi khi tải bộ câu hỏi khảo sát.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingQuestions(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, []);

  // ================== HANDLER CHỌN OPTION ==================
  const selectOption = (opt: Option) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: opt.value }));
  };

  const goNext = () => {
    if (total === 0) return;
    if (!selectedOptionValue) return;
    if (idx < total - 1) {
      setIdx((x) => x + 1);
    } else {
      setDone(true);
      setView('summary');
    }
  };

  const goPrev = () => {
    if (total === 0) return;
    setIdx((x) => Math.max(0, x - 1));
  };

  // 🔁 Làm lại khảo sát (reset state, không cần F5)
  const handleRedo = () => {
    setIdx(0);
    setAnswers({});
    setDone(false);
    setErrorMsg(null);
    setIsLoading(false);
    setUserInfo(null);
    setView('survey');
  };

  // ================== GỌI API GỢI Ý THÓI QUEN ==================
  const handleViewSuggestions = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const res: any = await recommendHabits(answers,20);
      console.log('[HabitSurvey] recommendHabits response:', res);

      let extractedUserInfo: UserInfo | null = null;
      const resUser =
        res?.userInfo ||
        res?.recommendations?.userInfo ||
        res?.data?.userInfo;
      if (resUser && typeof resUser === 'object') {
        extractedUserInfo = {
          name: resUser.name,
          age: resUser.age,
          ageGroup: resUser.ageGroup || resUser.ageGroupLabel,
          ageGroupCode: resUser.ageGroupCode,
          gender: resUser.gender || resUser.genderLabel,
          genderCode: resUser.genderCode,
        };
      } else if (res?.metadata?.personalizationSummary) {
        const summary = res.metadata.personalizationSummary;
        extractedUserInfo = {
          ageGroup: summary.ageGroupLabel || summary.ageGroup,
          gender: summary.genderLabel || summary.gender,
        };
      }

      // Parse mảng habits từ nhiều định dạng BE
      let base: Suggestion[] = [];
      if (Array.isArray(res)) base = res;
      else if (Array.isArray(res?.habits)) base = res.habits;
      else if (Array.isArray(res?.recommendations?.habits))
        base = res.recommendations.habits;
      else if (Array.isArray(res?.recommendations)) base = res.recommendations;
      else if (Array.isArray(res?.data)) base = res.data;

      if (!base || base.length === 0) {
        setErrorMsg('Không tìm thấy gợi ý thói quen phù hợp.');
        return;
      }

      setUserInfo(extractedUserInfo);

      // Ở đây tạm dùng domainScores mặc định (có thể sau này tính theo answers)
      const ds = defaultDomainScores;
      setDomainScores(ds);

      const weight = (s: Suggestion) => {
        if (s.category === 'mindful') return 100 - ds.mental;
        if (s.category === 'energy') return 100 - ds.physical;
        if (s.category === 'sleep') return 100 - ds.personal;
        return 80 - (ds.social + ds.personal) / 2;
      };

      const sorted = [...base].sort((a, b) => weight(b) - weight(a));
      setSuggestions(sorted);
      setSelectedHabits({});
      setView('suggestions');
    } catch (err) {
      console.error('[HabitSurvey] recommendHabits error:', err);
      setErrorMsg('Không thể tải gợi ý thói quen. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ================== GỬI KẾT QUẢ KHẢO SÁT LÊN BE ==================
  useEffect(() => {
    if (!done) return;
    const submit = async () => {
      try {
        const reqBody: any = { answers };
        if (sessionId) reqBody.sessionId = sessionId;

        const res = await submitSurvey(reqBody);
        console.log('[HabitSurvey] submitSurvey response:', res);
      } catch (err) {
        console.error('[HabitSurvey] submitSurvey error:', err);
        setErrorMsg('Không thể gửi kết quả khảo sát. Vui lòng thử lại.');
      }
    };
    submit();
  }, [done, answers, sessionId]);

  // ================== THÊM THÓI QUEN ==================
  const toggleHabit = (habit: Suggestion) => {
    const key = habit._id || habit.id || habit.name;
    setSelectedHabits((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addSelectedToHabits = async () => {
    const list = suggestions.filter((s) => {
      const key = s._id || s.id || s.name;
      return selectedHabits[key];
    });

    if (list.length === 0) {
      Alert.alert('Thông báo', 'Hãy chọn ít nhất 1 thói quen để thêm.');
      return;
    }

    try {
      setIsLoading(true);
      for (const s of list) {
        await createHabit(s);
      }
      Alert.alert('Thành công', 'Đã thêm thói quen vào danh sách.', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/habits'),
        },
      ]);
    } catch (e) {
      console.error('[HabitSuggestions] createHabit error:', e);
      Alert.alert('Lỗi', 'Không thể thêm thói quen. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // ================== UI CHUNG HEADER ==================
  const renderHeader = (title: string, subtitle?: string, showBackToHabits = true) => (
    <View style={styles.headerCard}>
      <View style={styles.headerLeft}>
        {showBackToHabits && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/habits')}
            style={styles.headerBackBtn}
          >
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.headerIconWrapper}>
        <Target size={20} color="#0f172a" />
      </View>
    </View>
  );

  // ================== UI: ĐANG LOAD CÂU HỎI ==================
  if (isLoadingQuestions && view === 'survey') {
    return (
      <View style={styles.page}>
        {renderHeader('Khảo sát thói quen', 'Đang tải bộ câu hỏi...')}
        <View style={styles.card}>
          <Text style={styles.textNormal}>Vui lòng chờ trong giây lát...</Text>
          <ActivityIndicator style={{ marginTop: 12 }} />
        </View>
      </View>
    );
  }

  // ================== UI: KHÔNG CÓ CÂU HỎI ==================
  if (!current && (view === 'survey' || view === 'summary')) {
    return (
      <View style={styles.page}>
        {renderHeader('Khảo sát thói quen', 'Không có câu hỏi để hiển thị')}
        <View style={[styles.card, styles.cardError]}>
          <Text style={styles.errorText}>
            {errorMsg || 'Không tải được bộ câu hỏi khảo sát.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/habits')}
            style={[styles.btnPrimary, { marginTop: 8 }]}
          >
            <Text style={styles.btnPrimaryText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ================== UI: ĐÃ HOÀN TẤT (SUMMARY) ==================
  if (view === 'summary') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
        {renderHeader('Hoàn tất khảo sát', 'Cảm ơn bạn đã trả lời', false)}

        <View style={styles.card}>
          <View style={styles.summaryBadge}>
            <Check size={16} color="#16a34a" />
            <Text style={styles.summaryBadgeText}>Đã hoàn thành {total} câu hỏi</Text>
          </View>

          <Text style={styles.textNormal}>
            Dựa trên câu trả lời của bạn, ứng dụng sẽ gợi ý các thói quen phù hợp.
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.summaryButtonsRow}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/habits')}
              style={styles.btnGray}
            >
              <Text style={styles.btnGrayText}>Về danh sách thói quen</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRedo} style={styles.btnWarning}>
              <Text style={styles.btnWarningText}>Làm lại khảo sát</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewSuggestions}
              disabled={isLoading}
              style={[
                styles.btnPrimary,
                isLoading ? { opacity: 0.7 } : null,
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {isLoading ? 'Đang tải gợi ý...' : 'Xem gợi ý'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ================== UI: GỢI Ý THÓI QUEN ==================
  if (view === 'suggestions') {
    return (
      <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header gợi ý */}
        {renderHeader(
          'Thói quen được gợi ý',
          `Dựa trên phân tích ${Object.keys(answers).length || 0} câu trả lời của bạn`,
        )}

        {/* Hồ sơ + tóm tắt */}
        <View style={styles.profileBanner}>
          <Text style={styles.profileTitle}>Ho so cua ban</Text>
          <Text style={styles.profileSubtitle}>
            {userInfo?.name || 'Nguoi ban ron can can bang'}
          </Text>

          {userInfo ? (
            <View style={styles.profileTagsRow}>
              {userInfo.gender ? (
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>Gioi tinh: {userInfo.gender}</Text>
                </View>
              ) : null}
              {userInfo.age != null ? (
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>{userInfo.age} tuoi</Text>
                </View>
              ) : null}
              {userInfo.ageGroup ? (
                <View style={styles.profileTag}>
                  <Text style={styles.profileTagText}>{userInfo.ageGroup}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.profileTagsRow}>
            <View style={styles.profileTag}>
              <Text style={styles.profileTagText}>
                {Object.keys(answers).length || 0}/{total} cau hoi da tra loi
              </Text>
            </View>
            <View style={styles.profileTag}>
              <Text style={styles.profileTagText}>
                {suggestions.length} goi y thoi quen
              </Text>
            </View>
          </View>
        </View>
        {/* 4 scores */}
        <View style={styles.scoreGrid}>
          {renderScoreBar('Mental', domainScores.mental)}
          {renderScoreBar('Physical', domainScores.physical)}
          {renderScoreBar('Social', domainScores.social)}
          {renderScoreBar('Personal', domainScores.personal)}
        </View>

        {/* Note */}
        <View style={styles.improveNote}>
          <Text style={styles.improveNoteText}>
            Các lĩnh vực cần cải thiện: Sức khỏe thể chất, Quản lý stress — Các thói quen dưới
            đây sẽ giúp bạn cải thiện những lĩnh vực này.
          </Text>
        </View>

        {/* Tóm tắt chọn */}
        <View style={styles.selectionSummary}>
          <View style={styles.selectionSummaryLeft}>
            <Check size={16} color="#2563eb" />
            <Text style={styles.selectionSummaryText}>
              Đã chọn {selectedCount} thói quen
            </Text>
          </View>
          <Text style={styles.selectionSummaryHint}>
            Chọn các thói quen bạn muốn bắt đầu
          </Text>
        </View>

        {/* Danh sách gợi ý */}
        {suggestions.map((s, i) => {
          const key = s._id || s.id || s.name;
          const isSelected = !!selectedHabits[key];

          return (
            <View key={key} style={styles.suggestionCard}>
              <View style={styles.suggestionHeaderRow}>
                <Text style={styles.suggestionTitle}>
                  #{i + 1} {s.title}
                </Text>
                <Text style={styles.suggestionScore}>{s.score}</Text>
              </View>
              <Text style={styles.suggestionName}>{s.name}</Text>

              <View style={styles.suggestionTagsRow}>
                <View style={styles.suggestionDiffTag}>
                  <Text style={styles.suggestionDiffText}>{s.difficulty}</Text>
                </View>
                <View style={styles.suggestionDescTag}>
                  <Text style={styles.suggestionDescText}>{s.description}</Text>
                </View>
              </View>

              <View style={styles.suggestionBottomRow}>
                <Text style={styles.suggestionCategory}>
                  Danh mục: {s.category}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleHabit(s)}
                  style={[
                    styles.selectHabitBtn,
                    isSelected && { borderColor: '#2563eb' },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectHabitText,
                      isSelected && { color: '#2563eb' },
                    ]}
                  >
                    {isSelected ? 'Đã chọn' : 'Chọn'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={() => setView('summary')}
            style={styles.btnGhost}
          >
            <View style={styles.bottomBtnRow}>
              <ChevronLeft size={16} />
              <Text style={styles.btnGhostText}>Quay lại</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={addSelectedToHabits}
            disabled={selectedCount === 0 || isLoading}
            style={[
              styles.btnPrimary,
              (selectedCount === 0 || isLoading) && { opacity: 0.6 },
            ]}
          >
            <View style={styles.bottomBtnRow}>
              <Text style={styles.btnPrimaryText}>Hoàn tất & thêm vào danh sách</Text>
              <ChevronRight size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ================== UI: MÀN HỎI CÂU HỎI (SURVEY) ==================
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 32 }}>
      {renderHeader(
        'Khảo sát thói quen',
        `Trả lời ${total} câu hỏi để nhận gợi ý phù hợp`,
      )}

      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressText}>
            Câu hỏi {idx + 1}/{total}
          </Text>
          <Text style={styles.progressText}>{progress}% hoàn thành</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Câu hỏi */}
      <View style={styles.questionCard}>
        <View style={styles.questionCategoryBadge}>
          <TrendingUp size={14} color="#16a34a" />
          <Text style={styles.questionCategoryText}>{current?.category}</Text>
        </View>
        <Text style={styles.questionTitle}>{current?.title}</Text>

        <View style={{ flexDirection: 'column', gap: 12 }}>
          {current?.options.map((opt) => {
            const isSelected = selectedOptionValue === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => selectOption(opt)}
                style={[
                  styles.optionBtn,
                  isSelected && styles.optionBtnSelected,
                ]}
              >
                {opt.emoji && <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>}
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && { color: '#4f46e5' },
                  ]}
                >
                  {opt.label}
                </Text>
                {isSelected && (
                  <View style={styles.optionCheckIcon}>
                    <Check size={18} color="#6366f1" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={idx === 0}
          style={[
            styles.btnGhost,
            idx === 0 && { opacity: 0.6 },
          ]}
        >
          <View style={styles.bottomBtnRow}>
            <ChevronLeft size={16} />
            <Text style={styles.btnGhostText}>Quay lại</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goNext}
          disabled={!selectedOptionValue}
          style={[
            styles.btnPrimary,
            !selectedOptionValue && { opacity: 0.6 },
          ]}
        >
          <View style={styles.bottomBtnRow}>
            <Text style={styles.btnPrimaryText}>
              {idx === total - 1 ? 'Hoàn tất' : 'Tiếp theo'}
            </Text>
            <ChevronRight size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// =============== COMPONENT PHỤ ===============
function renderScoreBar(label: string, value: number) {
  return (
    <View style={styles.scoreCard}>
      <View style={styles.scoreHeaderRow}>
        <View style={styles.scoreLabelRow}>
          <TrendingUp size={14} color="#334155" />
          <Text style={styles.scoreLabelText}>{label}</Text>
        </View>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressFill,
            { width: `${value}%`, backgroundColor: '#3b82f6' },
          ]}
        />
      </View>
    </View>
  );
}

// =============== STYLES ===============
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerCard: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  textNormal: {
    fontSize: 14,
    color: '#334155',
  },
  cardError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBox: {
    marginTop: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  summaryBadgeText: {
    fontWeight: '800',
    color: '#16a34a',
  },
  summaryButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width:'48%'
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  btnGray: {
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  btnGrayText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 13,
  },
  btnWarning: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnWarningText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  profileBanner: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
  },
  profileTitle: {
    fontWeight: '800',
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  profileSubtitle: {
    fontWeight: '900',
    fontSize: 16,
    color: '#ffffff',
    marginTop: 4,
  },
  profileTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  profileTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileTagText: {
    fontWeight: '800',
    color: '#ffffff',
    fontSize: 12,
  },

  scoreGrid: {
    marginHorizontal: 10,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  scoreCard: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabelText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 12,
  },
  scoreValue: {
    fontWeight: '800',
    color: '#0f172a',
  },

  improveNote: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  improveNoteText: {
    color: '#b45309',
    fontWeight: '700',
    fontSize: 13,
  },

  selectionSummary: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionSummaryText: {
    color: '#334155',
    fontWeight: '800',
  },
  selectionSummaryHint: {
    fontSize: 12,
    color: '#64748b',
  },

  suggestionCard: {
    marginHorizontal: 10,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  suggestionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionTitle: {
    fontWeight: '900',
    color: '#0f172a',
    fontSize: 14,
  },
  suggestionScore: {
    fontWeight: '900',
    color: '#2563eb',
  },
  suggestionName: {
    marginTop: 6,
    color: '#475569',
    fontSize: 13,
  },
  suggestionTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionDiffTag: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestionDiffText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 12,
  },
  suggestionDescTag: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suggestionDescText: {
    color: '#4338ca',
    fontWeight: '800',
    fontSize: 12,
  },
  suggestionBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionCategory: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  selectHabitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  selectHabitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },

  bottomBar: {
    marginHorizontal: 10,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    textAlign: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  progressCard: {
    marginHorizontal: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  progressBarBg: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#6366f1',
  },

  questionCard: {
    marginHorizontal: 10,
    marginTop: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  questionCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e9fce9',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  questionCategoryText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 12,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  optionBtn: {
    position: 'relative',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionBtnSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  optionLabel: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  optionCheckIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -9,
  },
});
