import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  text: '#111',
  subtext: '#6B6B6B',
  border: '#E9E9EF',
  primary: '#2563EB',
  danger: '#DC2626',
};

// =============================
// API CONFIG
// =============================
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.155:5000';

const token = "YOUR_TOKEN_HERE";

async function api(endpoint: string, method = "GET", body: any = null) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });

  return res.json();
}

// =============================
// Types
// =============================
type ItemType = 'shield' | 'freeze' | 'revive';

type HistoryItem = {
  id: number;
  habit: string;
  type: ItemType;
  date: string;
};

type Habit = {
  id: string;
  name: string;
};

function formatDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLabel(d: Date | null) {
  if (!d) return 'Chọn ngày';
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// =============================
// MAIN SCREEN
// =============================
export default function ItemsBagScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [items, setItems] = useState({ shield: 0, freeze: 0, revive: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedHabitName, setSelectedHabitName] = useState('');
  const [showHabitList, setShowHabitList] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ==================================
  // LOAD DATA FROM API
  // ==================================
  const loadHabits = async () => {
    try {
      const res = await api("/api/habits", "GET");

      if (res.success) {
        setHabits(res.habits);
      }
    } catch (err) {
      console.log("Load Habit Error:", err);
    }
  };

  const loadInventory = async () => {
    try {
      const res = await api("/api/inventory", "GET");

      if (res.success) {
        setItems({
          shield: res.inventory.streakShields,
          freeze: res.inventory.freezeTokens,
          revive: res.inventory.reviveTokens,
        });

        const mapped = res.usageHistory.map((h: any, idx: number) => ({
          id: idx + 1,
          habit: h.habitName,
          type:
            h.itemType === "streakShield"
              ? "shield"
              : h.itemType === "freeze"
                ? "freeze"
                : "revive",
          date: h.usedAt.slice(0, 10),
        }));

        setHistory(mapped);
      }
    } catch (err) {
      console.log("Load Inventory Error:", err);
    }
  };

  useEffect(() => {
    loadHabits();
    loadInventory();
  }, []);

  // ==================================
  // USE ITEM API
  // ==================================
  const useShield = async () => {
    const body = {
      habitId: selectedHabitId,
      date: formatDateISO(selectedDate!),
    };

    const res = await api("/api/inventory/use-shield", "POST", body);
    if (!res.success) {
      Alert.alert("Lỗi", res.message);
      return false;
    }

    setItems(prev => ({ ...prev, shield: res.data.inventory.streakShields }));
    return true;
  };

  const useFreeze = async () => {
    const body = {
      habitId: selectedHabitId,
      days: 1,
      startDate: formatDateISO(selectedDate!),
    };

    const res = await api("/api/inventory/use-freeze", "POST", body);
    if (!res.success) {
      Alert.alert("Lỗi", res.message);
      return false;
    }

    setItems(prev => ({ ...prev, freeze: res.inventory.freezeTokens }));
    return true;
  };

  const useRevive = async () => {
    const body = {
      habitId: selectedHabitId,
      date: formatDateISO(selectedDate!),
    };

    const res = await api("/api/inventory/use-revive", "POST", body);
    if (!res.success) {
      Alert.alert("Lỗi", res.message);
      return false;
    }

    setItems(prev => ({ ...prev, revive: res.inventory.reviveTokens }));
    return true;
  };

  // ==================================
  // CONFIRM USE
  // ==================================
  const handleConfirmUse = async () => {
    if (!selectedItem || !selectedHabitId || !selectedDate) {
      Alert.alert("Thiếu thông tin", "Hãy chọn Habit và ngày trước khi dùng.");
      return;
    }

    let success = false;

    if (selectedItem === "shield") success = await useShield();
    if (selectedItem === "freeze") success = await useFreeze();
    if (selectedItem === "revive") success = await useRevive();

    if (!success) return;

    const habName =
      selectedHabitName ||
      habits.find(h => h.id === selectedHabitId)?.name ||
      "Habit";

    setHistory(prev => [
      {
        id: prev.length > 0 ? prev[0].id + 1 : 1,
        habit: habName,
        type: selectedItem,
        date: formatDateISO(selectedDate),
      },
      ...prev,
    ]);

    Alert.alert("Thành công", "Đã sử dụng vật phẩm!");
    setModalVisible(false);

    setSelectedHabitId(null);
    setSelectedHabitName('');
    setSelectedDate(null);
    setSelectedItem(null);
  };

  const openModal = (itemType: ItemType) => {
    setSelectedItem(itemType);
    setModalVisible(true);
  };

  // ===============================
  // RENDER
  // ===============================
  return (
    <>
      <Stack.Screen options={{ title: 'Túi Vật Phẩm' }} />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      >
        <ItemCard
          title="Streak Shield"
          subtitle="Bảo vệ streak 1 ngày cụ thể"
          color="#1E40AF"
          available={items.shield}
          onUse={() => openModal('shield')}
        />

        <ItemCard
          title="Freeze Token"
          subtitle="Đóng băng habit 1–30 ngày"
          color="#0E7490"
          available={items.freeze}
          onUse={() => openModal('freeze')}
        />

        <ItemCard
          title="Revive Token"
          subtitle="Hồi sinh streak bị fail"
          color="#BE123C"
          available={items.revive}
          onUse={() => openModal('revive')}
        />

        <Text style={{ marginTop: 24, marginBottom: 8, fontWeight: '800', fontSize: 16 }}>
          Lịch Sử Sử Dụng
        </Text>

        {history.map(h => (
          <View
            key={h.id}
            style={{
              backgroundColor: COLORS.card,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{h.habit}</Text>
              <Text style={{ color: COLORS.subtext }}>{h.date}</Text>
            </View>

            <Text style={{ marginTop: 4 }}>
              {h.type === 'shield' && 'Sử dụng Shield'}
              {h.type === 'freeze' && 'Đóng băng habit'}
              {h.type === 'revive' && 'Hồi sinh streak'}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* MODAL */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 20,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text style={{ fontWeight: '800', fontSize: 18, marginBottom: 10 }}>
              Sử Dụng{' '}
              {selectedItem === 'shield'
                ? 'Streak Shield'
                : selectedItem === 'freeze'
                  ? 'Freeze Token'
                  : 'Revive Token'}
            </Text>

            {/* CHỌN HABIT */}
            <TouchableOpacity
              onPress={() => setShowHabitList(!showHabitList)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: selectedHabitId ? COLORS.text : COLORS.subtext }}>
                {selectedHabitId ? selectedHabitName : '— Chọn Habit —'}
              </Text>
              <Ionicons
                name={showHabitList ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={18}
                color={COLORS.subtext}
              />
            </TouchableOpacity>

            {showHabitList && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  borderRadius: 12,
                  marginBottom: 12,
                  maxHeight: 220,
                  overflow: 'hidden',
                }}
              >
                <ScrollView>
                  {habits.map(h => (
                    <TouchableOpacity
                      key={h.id}
                      onPress={() => {
                        setSelectedHabitId(h.id);
                        setSelectedHabitName(h.name);
                        setShowHabitList(false);
                      }}
                      style={{
                        padding: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                      }}
                    >
                      <Text style={{ fontWeight: '600' }}>{h.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* DATE PICKER */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                padding: 12,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: selectedDate ? COLORS.text : COLORS.subtext }}>
                {formatDateLabel(selectedDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmUse}
              style={{
                marginTop: 18,
                backgroundColor: COLORS.primary,
                padding: 14,
                borderRadius: 999,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '800' }}>
                Xác Nhận Sử Dụng
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 10,
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.danger }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}
    </>
  );
}

// =============================
// ITEM CARD COMPONENT
// =============================
function ItemCard({ title, subtitle, color, available, onUse }: any) {
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontWeight: '800', fontSize: 16 }}>{title}</Text>
      <Text style={{ color: COLORS.subtext, marginTop: 4 }}>{subtitle}</Text>

      <View
        style={{
          marginTop: 14,
          borderRadius: 10,
          backgroundColor: color,
          paddingVertical: 10,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={onUse}>
          <Text style={{ color: '#FFF', fontWeight: '800' }}>Sử dụng</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 8, color: COLORS.subtext }}>
        {available} có sẵn
      </Text>
    </View>
  );
}
