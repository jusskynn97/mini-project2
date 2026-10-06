import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  Alert, ToastAndroid, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRoom } from '../hooks/useRooms';
import { useBookingsByRoomDate } from '../hooks/useBookings';
import { buildSlots } from '../hooks/useTimeSlots';
import { useCreateBooking, ConflictError } from '../hooks/useCreateBooking';
import DateSelector from '../components/DateSelector';
import TimeSlotGrid from '../components/TimeSlotGrid';
import QRCheckInModal, { type QRModalBooking } from '../components/QRCheckInModal';
import { useBookingStore } from '../store/bookingStore';
import { scheduleCheckIn } from '../hooks/useNotificationSchedule';
import type { AppStackParamList } from '../navigation/types';

type RoomDetailRoute = RouteProp<{ RoomDetail: { roomId: string } }, 'RoomDetail'>;

const pad2 = (n: number) => n.toString().padStart(2, '0');
const getTodayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const showToast = (msg: string, bg = '#0F172A') => {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
};

const RoomDetailScreen: React.FC = () => {
  const route = useRoute<RoomDetailRoute>();
  const { roomId } = route.params;
  const { data: room, isLoading } = useRoom(roomId);
  const user = useBookingStore((s) => s.user);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso());
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrBooking, setQrBooking] = useState<QRModalBooking | null>(null);

  const { data: bookedSlots = [], refetch: refetchBookings } = useBookingsByRoomDate(roomId, selectedDate);
  const slots = useMemo(() => buildSlots(selectedDate), [selectedDate]);
  const selectedSlot = useMemo(
    () => slots.find((s) => s.slotId === selectedSlotId) ?? null,
    [slots, selectedSlotId]
  );

  const createBooking = useCreateBooking();

  const onConfirm = async () => {
    if (!selectedSlot || !room || !user) return;
    try {
      const res = await createBooking.mutateAsync({
        room_id: room.id,
        date_iso: selectedDate,
        slot_id: selectedSlot.slotId,
        start_time: new Date(selectedSlot.startTimeISO).toISOString(),
        end_time: new Date(selectedSlot.endTimeISO).toISOString(),
      });
      await scheduleCheckIn({
        bookingId: res.id,
        roomName: room.name,
        startTimeISO: selectedSlot.startTimeISO,
        slotLabel: selectedSlot.label,
      });
      setQrBooking({
        id: res.id,
        roomId: res.room_id,
        roomName: room.name,
        building: room.building,
        floor: room.floor,
        dateIso: res.date_iso,
        dateLabel: res.date_iso,
        slotLabel: selectedSlot.label,
        startISO: res.start_time,
        userId: user.id,
        status: 'confirmed',
      });
      setSelectedSlotId(null);
      setQrVisible(true);
    } catch (err) {
      if (err instanceof ConflictError) {
        Alert.alert('Xung đột đặt phòng', err.message);
      } else {
        showToast('Đặt phòng thất bại, thử lại.');
      }
      void refetchBookings();
    }
  };

  if (isLoading || !room) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <QRCheckInModal visible={qrVisible} booking={qrBooking} onClose={() => setQrVisible(false)} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: room.image }}
            style={styles.heroImage}
            contentFit="cover"
            transition={250}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.buildingLine}>
                Tòa {room.building} • Tầng {room.floor} • 👥 {room.seats} chỗ
              </Text>
            </View>
          </View>

          <View style={styles.amenities}>
            <Text style={styles.sectionTitle}>Thiết bị</Text>
            <View style={styles.amenitiesWrap}>
              {room.amenities.length === 0 && (
                <Text style={styles.muted}>Không có thông tin</Text>
              )}
              {room.amenities.map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn ngày</Text>
            <DateSelector selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlotId(null); }} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Chọn khung giờ</Text>
              <Text style={styles.muted}>2 giờ / slot</Text>
            </View>
            <TimeSlotGrid
              slots={slots}
              bookedSlots={bookedSlots}
              selected={selectedSlotId}
              onSelect={(id) => setSelectedSlotId((cur) => (cur === id ? null : id))}
            />
          </View>
          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      <View style={styles.stickyBar}>
        <View style={styles.stickyInfo}>
          {selectedSlot ? (
            <>
              <Text style={styles.stickySlot}>{selectedSlot.label}</Text>
              <Text style={styles.stickyDate}>{selectedDate}</Text>
            </>
          ) : (
            <>
              <Text style={styles.stickyPlaceholder}>Chọn slot để đặt</Text>
              <Text style={styles.stickySub}>Sau khi chọn sẽ hiển thị ở đây</Text>
            </>
          )}
        </View>
        <Pressable
          style={[styles.confirmBtn, !selectedSlot && styles.confirmBtnDisabled]}
          disabled={!selectedSlot || createBooking.isPending}
          onPress={onConfirm}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          {createBooking.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Confirm Booking</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 20 },
  heroWrap: {
    width: '100%', height: 220, backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  body: { paddingTop: 20, gap: 16 },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 12,
  },
  roomName: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  buildingLine: { marginTop: 4, fontSize: 14, color: '#64748B', fontWeight: '500' },
  amenities: { paddingHorizontal: 16 },
  section: { gap: 8 },
  sectionTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  amenitiesWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  amenityChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  amenityText: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
  muted: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  stickyBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  stickyInfo: { flex: 1, gap: 2 },
  stickySlot: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  stickyDate: { fontSize: 12, color: '#64748B' },
  stickyPlaceholder: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  stickySub: { fontSize: 11, color: '#CBD5E1' },
  confirmBtn: {
    paddingHorizontal: 20, paddingVertical: 15, borderRadius: 16,
    backgroundColor: '#2563EB', alignItems: 'center', minWidth: 160,
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});

export default RoomDetailScreen;
