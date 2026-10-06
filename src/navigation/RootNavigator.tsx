import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useBookingStore } from '../store/bookingStore';
import { useAuthInit } from '../hooks/useGoogleAuth';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import BrowseRoomsScreen from '../screens/BrowseRoomsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoomDetailScreen from '../screens/RoomDetailScreen';
import type { AuthStackParamList, AppTabParamList, AppStackParamList, RootStackParamList } from './types';

export type BrowseScreenProps = BottomTabScreenProps<AppTabParamList, 'BrowseRooms'>;
export type BookingsScreenProps = BottomTabScreenProps<AppTabParamList, 'MyBookings'>;
export type ProfileScreenProps = BottomTabScreenProps<AppTabParamList, 'Profile'>;
export type RoomDetailScreenProps = NativeStackScreenProps<AppStackParamList, 'RoomDetail'>;

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

type IconName = 'search' | 'calendar' | 'user';

const TabBarIcon: React.FC<{ name: IconName; focused: boolean; color: string }> = ({
  name, focused, color,
}) => {
  const icons: Record<IconName, string> = { search: '🔍', calendar: '📅', user: '👤' };
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, { color }]}>{icons[name]}</Text>
      {focused && <View style={[styles.dot, { backgroundColor: color }]} />}
    </View>
  );
};

const AppTabs: React.FC = () => (
  <Tabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarLabelStyle: styles.label,
      tabBarStyle: styles.tabBar,
      tabBarItemStyle: styles.tabItem,
    }}
  >
    <Tabs.Screen
      name="BrowseRooms"
      component={BrowseRoomsScreen}
      options={{
        tabBarLabel: 'Browse Rooms',
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon name="search" focused={focused} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="MyBookings"
      component={MyBookingsScreen}
      options={{
        tabBarLabel: 'My Bookings',
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon name="calendar" focused={focused} color={color} />
        ),
      }}
    />
    <Tabs.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon name="user" focused={focused} color={color} />
        ),
      }}
    />
  </Tabs.Navigator>
);

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="Login"
  >
    <AuthStack.Screen name="Splash" component={SplashScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

const AppNavigator: React.FC = () => (
  <AppStack.Navigator screenOptions={{ headerShadowVisible: false, headerTintColor: '#0F172A', headerTitleStyle: { fontWeight: '700' } }}>
    <AppStack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
    <AppStack.Screen
      name="RoomDetail"
      component={RoomDetailScreen}
      options={({ route }) => ({
        title: 'Room Detail',
        headerBackTitle: 'Back',
      })}
    />
  </AppStack.Navigator>
);

export type {
  AuthStackParamList,
  AppTabParamList,
  AppStackParamList,
  RootStackParamList,
  NavigatorScreenParams,
};

const RootNavigator: React.FC = () => {
  useAuthInit();
  const hydrated = useBookingStore((s) => s.hydrated);
  const user = useBookingStore((s) => s.user);

  useEffect(() => {
    // Fallback: force hydrate if persist middleware onRehydrateStorage hasn't fired
    const t = setTimeout(() => {
      const s = useBookingStore.getState();
      if (!s.hydrated) s.hydrate();
    }, 400);
    return () => clearTimeout(t);
  }, []);

  console.info(
    `[Nav] RootNavigator render — hydrated=${hydrated} user=${user ? user.id : 'null'} → ${user ? 'AppNavigator' : 'AuthNavigator'}`,
  );

  if (!hydrated) return <SplashScreen />;

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8FAFC' } }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <RootStack.Screen name="Tabs" component={AppNavigator} />
      )}
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 72, paddingTop: 6, paddingBottom: 18,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  tabItem: { paddingTop: 6, gap: 4 },
  label: { fontSize: 12, fontWeight: '600' },
  iconContainer: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconText: { fontSize: 22 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});

export default RootNavigator;
