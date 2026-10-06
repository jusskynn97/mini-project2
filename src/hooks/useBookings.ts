import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface BookingWithRoom {
  id: string;
  user_id: string;
  room_id: string;
  room_name: string;
  building: string;
  floor: number;
  date_iso: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  created_at: string;
}

export interface SlotBookingLite {
  slot_id: string;
  booking_id: string;
}

export const useMyBookings = () =>
  useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: async (): Promise<BookingWithRoom[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `id, user_id, room_id, date_iso, slot_id, start_time, end_time, status, created_at, rooms!inner(name, building, floor)`
        )
        .neq('status', 'pending')
        .order('start_time', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b) => ({
        id: b.id,
        user_id: b.user_id,
        room_id: b.room_id,
        room_name: (b.rooms as unknown as { name: string }).name,
        building: (b.rooms as unknown as { building: string }).building?.trim() ?? 'A',
        floor: (b.rooms as unknown as { floor: number }).floor ?? 1,
        date_iso: b.date_iso,
        slot_id: b.slot_id,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status as BookingWithRoom['status'],
        created_at: b.created_at,
      }));
    },
  });

export const useBookingsByRoomDate = (roomId: string | undefined, dateIso: string | undefined) =>
  useQuery({
    queryKey: ['bookings', 'room', roomId, dateIso],
    queryFn: async (): Promise<SlotBookingLite[]> => {
      if (!roomId || !dateIso) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('id, slot_id')
        .eq('room_id', roomId)
        .eq('date_iso', dateIso)
        .eq('status', 'confirmed');
      if (error) throw error;
      return (data ?? []).map((b) => ({ slot_id: b.slot_id, booking_id: b.id }));
    },
    enabled: !!roomId && !!dateIso,
  });

export const invalidateBookings = (
  qc: ReturnType<typeof useQueryClient>,
  opts?: { roomId?: string; dateIso?: string }
) => {
  void qc.invalidateQueries({ queryKey: ['bookings', 'mine'] });
  if (opts?.roomId && opts?.dateIso) {
    void qc.invalidateQueries({ queryKey: ['bookings', 'room', opts.roomId, opts.dateIso] });
  }
};
