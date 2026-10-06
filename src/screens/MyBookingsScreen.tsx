import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  SectionList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyBookings, type BookingWithRoom } from '../hooks/useBookings';
import { useCancelBooking } from '../hooks/useCancelBooking';
import QRCheckInModal, { type QRModalBooking } from '../components/QRCheckInModal';
import { useBookingStore } from '../store/bookingStore';
import { cancelScheduled } from '../hooks/useNotificationSchedule';

type SectionData = {
  title: string;
  data: BookingWithRoom[];
};

const now = () => new Date();

const minsUntilStart = (iso: string): number => (new Date(iso).getTime() - now().getTime()) / 60000;

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return `${wd}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const slotLabelFromTimes = (startIso: string, endIso: string): string => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const f = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${f(s)} – ${f(e)}`;
};

const MyBookingsScreen: React.FC = () => {
  const { data: bookings = [], isLoading, refetch } = useMyBookings();
  const cancel = useCancelBooking();
  const user = useBookingStore((s) => s.user);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrBooking, setQrBooking] = useState<QRModalBooking | null>(null);

  const sections = useMemo<SectionData[]>(() => {
    const upcoming: BookingWithRoom[] = [];
    const past: BookingWithRoom[] = [];
    const t = now().getTime();
    for (const b of bookings) {
      if (b.status !== 'confirmed') { past.push(b); continue; }
      if (new Date(b.start_time).getTime() > t) upcoming.push(b); else past.push(b);
    }
    const sortAsc = (a: BookingWithRoom, z: BookingWithRoom) =>
      new Date(a.start_time).getTime() - new Date(z.start_time).getTime();
    upcoming.sort(sortAsc);
    past.sort((a, z) => new Date(z.start_time).getTime() - new Date(a.start_time).getTime());
    return [
      { title: 'Upcoming', data: upcoming },
      { title: 'Past', data: past },
    ];
  }, [bookings]);

  const totalCount = bookings.length;
  const hoursUsed = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((acc, b) => {
        const dur = (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000;
        return acc + Math.max(0, dur);
      }, 0);
  }, [bookings]);

  const openQR = (b: BookingWithRoom) => {
    setQrBooking({
      id: b.id,
      roomId: b.room_id,
      roomName: b.room_name,
      building: b.building,
      floor: b.floor,
      dateIso: b.date_iso,
      dateLabel: b.date_iso,
      slotLabel: slotLabelFromTimes(b.start_time, b.end_time),
      startISO: b.start_time,
      userId: b.user_id,
      status: b.status,
    });
    setQrVisible(true);
  };

  const onCancel = (b: BookingWithRoom) => {
    Alert.alert(
      'Hủy đặt phòng',
      'Bạn chắc chắn muốn hủy đặt phòng này? Hành động không thể hoàn tác.',
      [
        { text: 'Trở lại', style: 'cancel' },
        {
          text: 'Hủy đặt phòng',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel.mutateAsync({
                bookingId: b.id, roomId: b.room_id, dateIso: b.date_iso,
              });
              await cancelScheduled(b.id);
              Alert.alert('Thành công', 'Đã hủy đặt phòng.');
              void refetch();
            } catch {
              Alert.alert('Lỗi', 'Không thể hủy đặt phòng.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <QRCheckInModal visible={qrVisible} booking={qrBooking} onClose={() => setQrVisible(false)} />

      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Bookings</Text>
        <Text style={styles.subtitle}>
          {totalCount} booking{totalCount !== 1 ? 's' : ''} • {hoursUsed.toFixed(1)}h used
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySubtitle}>Browse rooms and reserve your first study space.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const upcoming = sections[0].data.includes(item);
            const minsLeft = minsUntilStart(item.start_time);
            const canCancel = upcoming && minsLeft > 30;
            const disableCancelReason = upcoming && minsLeft <= 30
              ? 'Không thể hủy (còn ít hơn 30 phút)'
              : undefined;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
                onPress={() => upcoming && openQR(item)}
                android_ripple={{ color: 'rgba(15,23,42,0.05)' }}
                accessibilityLabel={`Booking ${item.room_name} ${formatDate(item.start_time)}`}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomName} numberOfLines={1}>{item.room_name}</Text>
                    <Text style={styles.buildingLine}>
                      Tòa {item.building} • Tầng {item.floor} • 👥
                    </Text>
                  </View>
                  <View style={[
                    styles.statusPill,
                    item.status === 'confirmed' ? styles.statusConfirmed
                      : item.status === 'cancelled' ? styles.statusCancelled
                      : styles.statusPending,
                  ]}>
                    <Text style={[
                      styles.statusText,
                      item.status === 'confirmed' ? { color: '#16A34A' }
                        : item.status === 'cancelled' ? { color: '#DC2626' }
                        : { color: '#CA8A04' },
                    ]}>
                      {item.status === 'confirmed' ? 'Confirmed'
                        : item.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>{formatDate(item.start_time)}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Time</Text>
                    <Text style={styles.metaValue}>{slotLabelFromTimes(item.start_time, item.end_time)}</Text>
                  </View>
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Ref</Text>
                    <Text style={styles.metaRef}>#{item.id.slice(0, 6).toUpperCase()}</Text>
                  </View>
                </View>

                {upcoming && (
                  <View style={styles.actionRow}>
                    {canCancel ? (
                      <Pressable
                        style={styles.cancelBtn}
                        onPress={() => onCancel(item)}
                        android_ripple={{ color: 'rgba(220,38,38,0.1)' }}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </Pressable>
                    ) : disableCancelReason ? (
                      <View style={styles.cancelBtnDisabled} accessibilityLabel={disableCancelReason}>
                        <Text style={styles.cancelTextDisabled}>Cancel disabled</Text>
                      </View>
                    ) : null}
                    <Pressable
                      style={styles.viewPassBtn}
                      onPress={() => openQR(item)}
                      android_ripple={{ color: 'rgba(37,99,235,0.15)' }}
                    >
                      <Text style={styles.viewPassText}>View pass</Text>
                    </Pressable>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 4,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 32 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, marginTop: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  sectionCount: {
    fontSize: 12, fontWeight: '700', color: '#64748B',
    backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  roomName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  buildingLine: { marginTop: 2, fontSize: 12, color: '#64748B' },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  statusConfirmed: { backgroundColor: '#DCFCE7' },
  statusCancelled: { backgroundColor: '#FEE2E2' },
  statusPending: { backgroundColor: '#FEF9C3' },
  statusText: { fontSize: 11, fontWeight: '800' },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaBlock: { flex: 1, gap: 2 },
  metaLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  metaValue: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  metaRef: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  cancelBtnDisabled: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  cancelText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  cancelTextDisabled: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  viewPassBtn: {
    flex: 1.3, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  viewPassText: { color: '#1D4ED8', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
});

export default MyBookingsScreen;
