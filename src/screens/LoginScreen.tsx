import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

const LoginScreen: React.FC = () => {
  const { signIn, isSigningIn } = useGoogleAuth();

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối Google. Vui lòng thử lại.';
      if (msg.includes('Sign-in was cancelled')) return;
      Alert.alert('Đăng nhập thất bại', msg);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🎓</Text>
        <Text style={styles.title}>Study Room Booking</Text>
        <Text style={styles.subtitle}>
          Tìm & đặt phòng học trên campus chỉ trong vài giây.
        </Text>
      </View>

      <View style={styles.featureList}>
        {[
          { icon: '🔍', title: 'Tìm kiếm thông minh', desc: 'Lọc theo tòa nhà, sức chứa, thiết bị' },
          { icon: '⚡', title: 'Chống xung đột real-time', desc: 'Slot đã đặt bị disable tức thì' },
          { icon: '🎫', title: 'QR Check-in', desc: 'Booking pass đi kèm mã QR xác thực' },
          { icon: '⏰', title: 'Nhắc trước 15 phút', desc: 'Local notification không bỏ lỡ' },
        ].map((f) => (
          <View key={f.title} style={styles.featureItem}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={[styles.googleBtn, isSigningIn && styles.googleBtnDisabled]}
          disabled={isSigningIn}
          onPress={handleLogin}
          android_ripple={{ color: 'rgba(37,99,235,0.1)' }}
        >
          {isSigningIn ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.tos}>
          Tiếp tục nghĩa là bạn đồng ý với Điều khoản & Chính sách bảo mật.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { paddingHorizontal: 24, paddingTop: 48, gap: 10, alignItems: 'flex-start' },
  heroEmoji: { fontSize: 56 },
  title: { fontSize: 30, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748B', lineHeight: 22 },
  featureList: { paddingHorizontal: 24, marginTop: 32, gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EFF6FF', textAlign: 'center',
    lineHeight: 44, fontSize: 22,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  featureDesc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  bottom: { marginTop: 'auto', padding: 24, gap: 12, alignItems: 'center' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleIcon: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    color: '#2563EB', textAlign: 'center', lineHeight: 22,
    fontWeight: '800', fontSize: 14,
  },
  googleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  tos: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
});

export default LoginScreen;
