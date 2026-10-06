import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useBookingStore } from '../store/bookingStore';
import { useMyBookings } from '../hooks/useBookings';
import { signOutGoogle } from '../hooks/useGoogleAuth';

const ProfileScreen: React.FC = () => {
  const user = useBookingStore((s) => s.user);
  const logout = useBookingStore((s) => s.logout);
  const { data: bookings = [], isLoading: bookingsLoading } = useMyBookings();

  const stats = useMemo(() => {
    const count = bookings.filter((b) => b.status === 'confirmed').length;
    const hours = bookings.filter((b) => b.status === 'confirmed').reduce((acc, b) => {
      return acc + (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / 3600000;
    }, 0);
    return { count, hours, favorites: 0 };
  }, [bookings]);

  const menuItems = [
    { label: 'Personal Info', desc: 'Name, email, student ID', icon: '👤' },
    { label: 'Notification Settings', desc: 'Booking reminders & alerts', icon: '🔔' },
    { label: 'Privacy & Security', desc: 'Data and account protection', icon: '🔒' },
    { label: 'Help & Support', desc: 'FAQ and contact campus IT', icon: '💬' },
    { label: 'About', desc: 'Study Room Booking v1.0.0', icon: 'ℹ️' },
  ];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutGoogle();
          } finally {
            logout();
          }
        },
      },
    ]);
  };

  const initials = (user?.name ?? 'U').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name ?? 'Guest User'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email ?? 'guest@campus.edu'}
            </Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>🔐 Logged in with Google</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {bookingsLoading ? <ActivityIndicator size="small" color="#2563EB" /> : stats.count}
            </Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{bookingsLoading ? '—' : stats.hours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Hours Used</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, idx) => (
            <Pressable
              key={item.label}
              style={[
                styles.menuItem,
                idx === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
                idx === menuItems.length - 1 && {
                  borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
                },
                idx !== menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => Alert.alert('Coming soon', 'Tính năng này sẵn sàng trong cập nhật sau.')}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              accessibilityLabel={item.label}
            >
              <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={handleSignOut}
          android_ripple={{ color: 'rgba(220,38,38,0.1)' }}
          accessibilityLabel="Sign Out"
        >
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  content: { padding: 16, gap: 16 },
  profileCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  email: { fontSize: 13, color: '#64748B' },
  tag: {
    marginTop: 4, backgroundColor: '#DBEAFE', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  tagText: { color: '#2563EB', fontWeight: '700', fontSize: 12 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E2E8F0' },
  menu: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFFFFF',
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  menuDesc: { fontSize: 12, color: '#94A3B8' },
  menuArrow: { fontSize: 22, color: '#CBD5E1', fontWeight: '500' },
  logoutBtn: {
    backgroundColor: '#FEE2E2', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});

export default ProfileScreen;
