import { useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { BookingWithRoom } from './useBookings';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const notifMap: Record<string, string> = {};

export const ensurePermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: next } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return next === 'granted';
};

interface ScheduleInput {
  bookingId: string;
  roomName: string;
  startTimeISO: string;
  slotLabel: string;
}

export const scheduleCheckIn = async (input: ScheduleInput): Promise<string | null> => {
  const start = new Date(input.startTimeISO).getTime();
  const triggerAt = start - 15 * 60 * 1000;
  const now = Date.now();
  if (triggerAt <= now) {
    console.warn('[notif] Skip scheduling: trigger in the past');
    return null;
  }
  const ok = await ensurePermissions();
  if (!ok) return null;
  const timeStr = input.slotLabel.split('–')[0]?.trim() ?? '';
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Check-in Reminder',
      body: `Phòng ${input.roomName} lúc ${timeStr} sắp đến. Vui lòng đến trước.`,
      sound: true,
      data: { bookingId: input.bookingId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(triggerAt) },
  });
  notifMap[input.bookingId] = id;
  return id;
};

export const cancelScheduled = async (bookingId: string): Promise<void> => {
  const id = notifMap[bookingId];
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
  delete notifMap[bookingId];
};

export const useNotificationSchedule = () => {
  const ref = useRef<typeof notifMap>(notifMap);

  const schedule = useCallback(
    async (b: BookingWithRoom, slotLabel: string) =>
      scheduleCheckIn({
        bookingId: b.id,
        roomName: b.room_name,
        startTimeISO: b.start_time,
        slotLabel,
      }),
    []
  );

  const cancel = useCallback(async (bookingId: string) => cancelScheduled(bookingId), []);

  return { schedule, cancel, ref };
};
