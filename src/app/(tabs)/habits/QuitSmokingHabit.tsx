import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions
} from 'react-native';
import { ChevronLeft, Ban, Info, AlertCircle, Heart, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { getHabitTemplateById, createHabitFromTemplate } from '../../../server/habits';

const { width } = Dimensions.get('window');

export default function QuitSmokingHabit() {
  const [habitData, setHabitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { templateId } = useLocalSearchParams();
  const isEditMode = useMemo(
    () => !!templateId && templateId !== 'null' && templateId !== 'undefined',
    [templateId]
  );
  
  console.log('templateId:', templateId);

  const handleAddHabit = async () => {
    if (!templateId) {
      console.error('Template ID is missing');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createHabitFromTemplate(templateId);
      console.log('Habit created:', response);
      router.replace('/(tabs)/habits');
    } catch (err) {
      console.error('Error creating habit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.replace('/(tabs)/habits/AddHabitModal');
  };

  useEffect(() => {
    const fetchHabitTemplate = async () => {
      try {
        setLoading(true);
        const data = await getHabitTemplateById(templateId);
        
        console.log('Habit data:', data);
        
        if (data.success && data.template) {
          setHabitData(data.template);
        }
      } catch (error) {
        console.error('Error fetching habit template:', error);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchHabitTemplate();
    } else {
      setLoading(false);
    }
  }, [templateId]);

  const habitName = habitData?.name || 'Không hút thuốc';
  const habitDescription = habitData?.description || 'Từ bỏ thuốc lá để cải thiện sức khỏe và tiết kiệm chi phí';
  const habitDifficulty = habitData?.difficulty || 'Khó';
  const habitIcon = habitData?.icon || '🚭';
  
  const tips = habitData?.tips || [
    'Tránh xa những người đang hút thuốc',
    'Thay thế bằng kẹo cao su hoặc nước lọc',
    'Tham gia nhóm hỗ trợ cai thuốc',
    'Tính toán số tiền tiết kiệm được'
  ];

  const challenges = habitData?.commonObstacles || [
    'Cơn thèm thuốc mạnh mẽ',
    'Stress và lo âu tăng cao',
    'Bạn bè rủ hút thuốc',
    'Thói quen lâu năm khó bỏ'
  ];

  const benefits = habitData?.benefits || [
    'Phổi khỏe mạnh hơn',
    'Tiết kiệm hàng triệu đồng mỗi tháng',
    'Giảm 50% nguy cơ ung thư phổi',
    'Cải thiện mùi hơi thở và da'
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#60a5fa', '#a78bfa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleCancel}
          >
            <ChevronLeft size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết thói quen</Text>
        </View>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon and Title */}
        <View style={styles.iconTitleContainer}>
          <View style={styles.iconCircle}>
            {habitIcon === '🚭' ? (
              <Ban color="#ef4444" size={40} />
            ) : (
              <Text style={styles.iconEmoji}>{habitIcon}</Text>
            )}
          </View>
          <Text style={styles.mainTitle}>{habitName}</Text>
          <View style={styles.titleMeta}>
            <Text style={styles.controlText}>Control</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{habitDifficulty}</Text>
            </View>
          </View>
        </View>

        {/* Mô tả Section */}
        <View style={[styles.section, styles.sectionGray]}>
          <View style={styles.sectionHeader}>
            <Info color="#4b5563" size={18} />
            <Text style={[styles.sectionTitle, styles.titleGray]}>Mô tả</Text>
          </View>
          <Text style={styles.descriptionText}>{habitDescription}</Text>
        </View>

        {/* Mẹo hữu ích Section */}
        <View style={[styles.section, styles.sectionBlue]}>
          <View style={styles.sectionHeader}>
            <Heart color="#2563eb" size={18} />
            <Text style={[styles.sectionTitle, styles.titleBlue]}>Mẹo hữu ích</Text>
          </View>
          {tips.map((tip, idx) => (
            <View key={idx} style={styles.listItem}>
              <View style={[styles.bullet, styles.bulletBlue]} />
              <Text style={styles.listItemText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Khó khăn thường gặp Section */}
        <View style={[styles.section, styles.sectionRed]}>
          <View style={styles.sectionHeader}>
            <AlertCircle color="#dc2626" size={18} />
            <Text style={[styles.sectionTitle, styles.titleRed]}>Khó khăn thường gặp</Text>
          </View>
          {challenges.map((challenge, idx) => (
            <View key={idx} style={styles.listItem}>
              <View style={[styles.bullet, styles.bulletRed]} />
              <Text style={styles.listItemText}>{challenge}</Text>
            </View>
          ))}
        </View>

        {/* Lợi ích Section */}
        <View style={[styles.section, styles.sectionGreen]}>
          <View style={styles.sectionHeader}>
            <Heart color="#16a34a" size={18} />
            <Text style={[styles.sectionTitle, styles.titleGreen]}>Lợi ích</Text>
          </View>
          {benefits.map((benefit, idx) => (
            <View key={idx} style={styles.listItem}>
              <Check color="#16a34a" size={16} />
              <Text style={styles.listItemText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statsText}>👥 1,234 người đang thực hiện</Text>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleAddHabit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#a78bfa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Đang xử lý...' : '✓ Bắt đầu ngay'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{ height : 100}}>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: 0,
    right: -64,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 64,
  },
  headerCircle2: {
    position: 'absolute',
    bottom: -48,
    left: -48,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 48,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  iconTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#fee2e2',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 40,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlText: {
    fontSize: 16,
    color: '#6b7280',
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
  },
  difficultyText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionGray: {
    backgroundColor: '#f9fafb',
  },
  sectionBlue: {
    backgroundColor: '#eff6ff',
  },
  sectionRed: {
    backgroundColor: '#fef2f2',
  },
  sectionGreen: {
    backgroundColor: '#f0fdf4',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  titleGray: {
    color: '#374151',
  },
  titleBlue: {
    color: '#1e40af',
  },
  titleRed: {
    color: '#991b1b',
  },
  titleGreen: {
    color: '#15803d',
  },
  descriptionText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletBlue: {
    backgroundColor: '#3b82f6',
  },
  bulletRed: {
    backgroundColor: '#ef4444',
  },
  stats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statsText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  buttonContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '500',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
});