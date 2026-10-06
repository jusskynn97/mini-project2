import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SplashScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.logoEmoji}>📚</Text>
        <Text style={styles.title}>Study Room Booking</Text>
        <Text style={styles.subtitle}>Reserve your perfect study space</Text>
        <ActivityIndicator style={styles.spinner} size="large" color="#2563EB" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  logoEmoji: { fontSize: 72 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 15, color: '#64748B' },
  spinner: { marginTop: 32 },
});

export default SplashScreen;
