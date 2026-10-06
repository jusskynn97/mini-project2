import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import type { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onPress?: (room: Room) => void;
}

const statusConfig = {
  available: { label: 'Available Now', color: '#16A34A', bg: '#DCFCE7' },
  occupied: { label: 'Occupied', color: '#DC2626', bg: '#FEE2E2' },
  maintenance: { label: 'Maintenance', color: '#CA8A04', bg: '#FEF9C3' },
};

const RoomCardComponent: React.FC<RoomCardProps> = ({ room, onPress }) => {
  const status = statusConfig[room.status];
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(room)}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      accessibilityLabel={`Phòng ${room.name}, tòa nhà ${room.building}, tầng ${room.floor}`}
    >
      <Image source={{ uri: room.image }} style={styles.image} contentFit="cover" transition={200} cachePolicy="memory-disk" />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{room.name}</Text>
        <Text style={styles.building} numberOfLines={1}>Tòa {room.building} • Tầng {room.floor}</Text>
        <View style={styles.row}>
          <View style={styles.seatsBadge}>
            <Text style={styles.seatsText}>👥 {room.seats}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const RoomCard = memo(RoomCardComponent, (prev, next) => prev.room.id === next.room.id);
export default RoomCard;

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  image: { width: '100%', height: 120, backgroundColor: '#F1F5F9' },
  content: { padding: 12, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  building: { fontSize: 12, color: '#64748B' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 6 },
  seatsBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  seatsText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '700' },
});
