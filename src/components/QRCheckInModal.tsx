import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Dimensions, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { AppTabParamList } from '../navigation/types';

const { height: DEVICE_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = DEVICE_HEIGHT * 0.85;

export interface QRModalBooking {
  id: string;
  roomId: string;
  roomName: string;
  building: string;
  floor: number;
  dateIso: string;
  dateLabel: string;
  slotLabel: string;
  startISO: string;
  userId: string;
  status: 'confirmed' | 'cancelled' | 'pending';
}

interface Props {
  visible: boolean;
  booking: QRModalBooking | null;
  onClose: () => void;
}

const formatDateLabel = (iso: string): string => {
  try {
    const d = new Date(iso);
    const wd = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
    return `${wd}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

const QRCheckInModal: React.FC<Props> = ({ visible, booking, onClose }) => {
  const nav = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
  const translateY = useSharedValue(0);
  const translateBack = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
      translateBack.value = withSpring(0, { damping: 20, stiffness: 220 });
    }
  }, [visible, translateY, translateBack]);

  const close = () => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 280 }, (done) => {
      if (done) runOnJS(onClose)();
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e: { translationY: number }) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e: { translationY: number }) => {
      if (e.translationY > 160) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => {
    const drag = translateY.value;
    return {
      transform: [
        {
          translateY: interpolate(drag, [0, SHEET_HEIGHT], [0, SHEET_HEIGHT], Extrapolation.CLAMP),
        },
      ],
      opacity: interpolate(drag, [0, SHEET_HEIGHT * 0.7], [1, 0.4], Extrapolation.CLAMP),
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: visible
      ? interpolate(translateY.value, [0, SHEET_HEIGHT * 0.5], [0.55, 0.1], Extrapolation.CLAMP)
      : 0,
  }));

  const shortId = booking?.id?.slice(0, 8).toUpperCase() ?? '—';
  const qrValue = booking
    ? JSON.stringify({
        bookingId: booking.id,
        userId: booking.userId,
        roomId: booking.roomId,
        startTs: booking.startISO,
      })
    : '{}';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Đóng modal" />
        </Animated.View>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
              <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>Your Booking Pass</Text>
                  <Pressable
                    style={styles.closeBtn}
                    onPress={close}
                    accessibilityLabel="Close"
                    hitSlop={12}
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.qrCard}>
                  <QRCode value={qrValue} size={220} color="#0F172A" backgroundColor="#FFFFFF" />
                  <View style={styles.qrBadgeRow}>
                    <View style={styles.confirmedBadge}>
                      <Text style={styles.confirmedText}>Confirmed</Text>
                    </View>
                    <Text style={styles.bookingId}>BK-{shortId}</Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <InfoRow label="Room" value={booking?.roomName ?? '—'} highlight />
                  <InfoRow label="Building" value={`Tòa ${booking?.building ?? '—'} • Tầng ${booking?.floor ?? '—'}`} />
                  <InfoRow label="Date" value={booking ? formatDateLabel(booking.dateIso) : '—'} />
                  <InfoRow label="Time" value={booking?.slotLabel ?? '—'} />
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={close}
                    android_ripple={{ color: 'rgba(15,23,42,0.06)' }}
                  >
                    <Text style={styles.secondaryText}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => { close(); setTimeout(() => nav.navigate('MyBookings'), 180); }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.primaryText}>View in My Bookings</Text>
                  </Pressable>
                </View>

                <Text style={styles.footnote}>
                  Hiển thị mã QR này tại quầy check-in hoặc quét tại đầu vào phòng.
                </Text>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label, value, highlight,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && { fontWeight: '700', color: '#0F172A' }]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handleRow: { alignItems: 'center', paddingTop: 10 },
  handle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3 },
  content: { padding: 20, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 14, color: '#64748B', fontWeight: '700' },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 20, alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  qrBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmedBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
  },
  confirmedText: { color: '#16A34A', fontWeight: '800', fontSize: 12 },
  bookingId: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#475569', fontSize: 12 },
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#334155', fontWeight: '600', textAlign: 'right', flex: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  secondaryBtn: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16, paddingVertical: 14, alignItems: 'center',
  },
  secondaryText: { color: '#334155', fontWeight: '700', fontSize: 14 },
  primaryBtn: {
    flex: 2, backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  footnote: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, marginTop: 6 },
});

export default QRCheckInModal;
