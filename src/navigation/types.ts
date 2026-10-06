import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

export type AppTabParamList = {
  BrowseRooms: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList>;
  RoomDetail: { roomId: string };
};

export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
} & AuthStackParamList &
  AppStackParamList;
