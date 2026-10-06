import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable,
  ActivityIndicator, RefreshControl, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRooms } from '../hooks/useRooms';
import RoomCard from '../components/RoomCard';
import type { Room, RoomStatus } from '../types';
import type { AppStackParamList } from '../navigation/RootNavigator';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type BuildingFilter = 'All' | 'A' | 'B' | 'C' | 'V';
type CapacityFilter = 'All' | '2-4' | '5-10' | '11-20' | '20+';
type EquipmentFilter = 'All' | 'Projector' | 'Whiteboard' | 'High-spec PC' | 'AC';

const buildings: { value: BuildingFilter; label: string }[] = [
  { value: 'All', label: 'All' }, { value: 'A', label: 'A' },
  { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'V', label: 'V' },
];
const capacities: { value: CapacityFilter; label: string }[] = [
  { value: 'All', label: 'All' }, { value: '2-4', label: '2-4 seats' },
  { value: '5-10', label: '5-10' }, { value: '11-20', label: '11-20' }, { value: '20+', label: '20+' },
];
const equipments: { value: EquipmentFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Projector', label: 'Projector' },
  { value: 'Whiteboard', label: 'Whiteboard' },
  { value: 'High-spec PC', label: 'High-spec PC' },
  { value: 'AC', label: 'AC' },
];

const BrowseRoomsScreen: React.FC = () => {
  const nav = useNavigation<NativeStackNavigationProp<AppStackParamList, 'Tabs'>>();
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState<BuildingFilter>('All');
  const [capacity, setCapacity] = useState<CapacityFilter>('All');
  const [equipment, setEquipment] = useState<EquipmentFilter>('All');
  const [showFilters, setShowFilters] = useState(true);

  const { data: rooms, isLoading, refetch, isRefetching } = useRooms();

  const filteredRooms = useMemo<Room[]>(() => {
    if (!rooms) return [];
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      const matchSearch = !q ||
        r.name.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q) ||
        r.amenities.some((a) => a.toLowerCase().includes(q));
      const matchBuilding = building === 'All' || r.building === building;
      const matchCapacity = (() => {
        if (capacity === 'All') return true;
        if (capacity === '2-4') return r.seats >= 2 && r.seats <= 4;
        if (capacity === '5-10') return r.seats >= 5 && r.seats <= 10;
        if (capacity === '11-20') return r.seats >= 11 && r.seats <= 20;
        if (capacity === '20+') return r.seats > 20;
        return true;
      })();
      const matchEquipment = equipment === 'All' || r.amenities.includes(equipment);
      return matchSearch && matchBuilding && matchCapacity && matchEquipment;
    });
  }, [rooms, search, building, capacity, equipment]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  };

  const openRoom = useCallback((room: Room) => {
    nav.navigate('RoomDetail', { roomId: room.id });
  }, [nav]);

  const renderItem = useCallback(({ item }: { item: Room }) => (
    <RoomCard room={item} onPress={openRoom} />
  ), [openRoom]);

  const keyExtractor = useCallback((item: Room) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: 208, offset: 208 * index + 12 * (index === 0 ? 0 : 1), index }),
    []
  );

  const ChipRow = <T extends string>({
    data, value, onChange,
  }: {
    data: { value: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
  }) => (
    <FlatList
      data={data}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(f) => f.value}
      renderItem={({ item }) => {
        const active = value === item.value;
        return (
          <Pressable
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(item.value)}
            accessibilityLabel={`Filter ${item.label}`}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      }}
      contentContainerStyle={styles.chipContent}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Browse Rooms</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search rooms, buildings, amenities..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              accessibilityLabel="Tìm kiếm phòng"
            />
          </View>
          <Pressable
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={toggleFilters}
            accessibilityLabel="Bộ lọc"
          >
            <Text style={styles.filterBtnText}>Filter</Text>
            <Text style={styles.filterChevron}>{showFilters ? '▲' : '▼'}</Text>
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.filterGroups}>
            <View style={styles.chipRow}>
              <Text style={styles.chipGroupLabel}>Building</Text>
              <ChipRow<BuildingFilter> data={buildings} value={building} onChange={setBuilding} />
            </View>
            <View style={styles.chipRow}>
              <Text style={styles.chipGroupLabel}>Capacity</Text>
              <ChipRow<CapacityFilter> data={capacities} value={capacity} onChange={setCapacity} />
            </View>
            <View style={styles.chipRow}>
              <Text style={styles.chipGroupLabel}>Equipment</Text>
              <ChipRow<EquipmentFilter> data={equipments} value={equipment} onChange={setEquipment} />
            </View>
          </View>
        )}

        <View style={styles.resultRow}>
          <Text style={styles.resultText}>
            {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loaderText}>Loading rooms...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews
          maxToRenderPerBatch={6}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={8}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No rooms found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563EB" />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12,
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterBtnActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  filterBtnText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  filterChevron: { fontSize: 10, color: '#64748B' },
  filterGroups: { gap: 10 },
  chipRow: { gap: 6 },
  chipGroupLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginLeft: 2 },
  chipContent: { gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  resultRow: { paddingTop: 2 },
  resultText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  listContent: { padding: 16, gap: 12 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: { fontSize: 14, color: '#64748B' },
});

export default BrowseRoomsScreen;
