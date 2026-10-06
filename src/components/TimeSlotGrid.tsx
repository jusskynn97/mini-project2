import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle, withSpring, withTiming,
  ZoomIn, FadeIn, Layout,
} from 'react-native-reanimated';
import type { BuildSlotResult } from '../hooks/useTimeSlots';
import type { SlotBookingLite } from '../hooks/useBookings';

interface Props {
  slots: BuildSlotResult[];
  bookedSlots: SlotBookingLite[];
  selected: string | null;
  onSelect: (slotId: string) => void;
}

const isPast = (iso: string): boolean => new Date(iso).getTime() <= Date.now();

const PressableSlot: React.FC<{
  slot: BuildSlotResult;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
  index: number;
}> = ({ slot, disabled, selected, onPress, index }) => {
  const as = useAnimatedStyle(() => ({
    transform: [{
      scale: selected ? withSpring(1.04, { damping: 14, stiffness: 220 }) : withTiming(1, { duration: 120 }),
    }],
  }), [selected]);

  return (
    <Animated.View
      entering={FadeIn.duration(200 + index * 30)}
      layout={Layout.springify()}
      style={[{ flex: 1 }, as]}
    >
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.slot,
          disabled && styles.slotDisabled,
          selected && styles.slotSelected,
        ]}
        accessibilityLabel={`Slot ${slot.label} ${disabled ? '(không khả dụng)' : ''}`}
        accessibilityState={{ disabled, selected }}
      >
        <Text style={[styles.timeText, disabled && styles.textDisabled, selected && styles.textSelected]} numberOfLines={1}>
          {slot.label}
        </Text>
        {!disabled && !selected && <Text style={styles.tagOpen}>Available</Text>}
        {disabled && <Text style={styles.tagDisabled}>Booked</Text>}
        {selected && <Text style={styles.tagSelected}>Selected</Text>}
      </Pressable>
    </Animated.View>
  );
};

const TimeSlotGrid: React.FC<Props> = ({ slots, bookedSlots, selected, onSelect }) => {
  const bookedIds = new Set(bookedSlots.map((s) => s.slot_id));
  return (
    <View style={styles.grid}>
      {slots.map((s, i) => {
        const disabled = bookedIds.has(s.slotId) || isPast(s.startTimeISO);
        const active = selected === s.slotId;
        return (
          <View key={s.slotId} style={[
            styles.cell,
            { flexBasis: '48%' },
            i % 2 === 0 ? undefined : { marginLeft: '4%' },
          ]}>
            <PressableSlot
              slot={s}
              disabled={disabled}
              selected={active}
              onPress={() => onSelect(s.slotId)}
              index={i}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  cell: { marginBottom: 12 },
  slot: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  slotSelected: {
    backgroundColor: '#2563EB', borderColor: '#2563EB',
    shadowColor: '#2563EB', shadowOpacity: 0.28, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  slotDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', opacity: 0.55 },
  timeText: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  textSelected: { color: '#FFFFFF' },
  textDisabled: { color: '#94A3B8' },
  tagOpen: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  tagDisabled: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  tagSelected: { fontSize: 10, fontWeight: '700', color: '#DBEAFE' },
});

export default TimeSlotGrid;
