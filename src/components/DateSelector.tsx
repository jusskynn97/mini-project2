import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';

interface Props {
  selected: string;
  onSelect: (dateIso: string) => void;
}

const pad2 = (n: number): string => n.toString().padStart(2, '0');

const build7Days = (): { iso: string; dayName: string; dayNum: string; isToday: boolean; month: string }[] => {
  const out: ReturnType<typeof build7Days> = [];
  const now = new Date();
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    out.push({
      iso,
      dayName: dayNames[d.getDay()],
      dayNum: String(d.getDate()),
      isToday: i === 0,
      month: months[d.getMonth()],
    });
  }
  return out;
};

const DateSelector: React.FC<Props> = ({ selected, onSelect }) => {
  const days = build7Days();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={76}
      decelerationRate="fast"
      contentContainerStyle={styles.wrap}
    >
      {days.map((d, idx) => {
        const active = selected === d.iso;
        return (
          <Animated.View
            key={d.iso}
            entering={FadeInRight.duration(250 + idx * 40)}
            layout={Layout.springify()}
          >
            <Pressable
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onSelect(d.iso)}
              accessibilityLabel={`Chọn ngày ${d.dayNum} ${d.month}`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.dayName, active && styles.textActive]}>{d.isToday ? 'Today' : d.dayName}</Text>
              <Text style={[styles.dayNum, active && styles.textActive]}>{d.dayNum}</Text>
              <Text style={[styles.month, active && styles.textActive]}>{d.month}</Text>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingHorizontal: 16, paddingVertical: 4 },
  item: {
    width: 66,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  itemActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dayName: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  dayNum: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  month: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  textActive: { color: '#FFFFFF' },
});

export default DateSelector;
