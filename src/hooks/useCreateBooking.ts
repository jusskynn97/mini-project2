import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { invalidateBookings } from './useBookings';
import { useBookingStore } from '../store/bookingStore';

export interface CreateBookingInput {
  room_id: string;
  date_iso: string;
  slot_id: string;
  start_time: string;
  end_time: string;
}

export interface BookingCreatedPayload {
  id: string;
  room_id: string;
  date_iso: string;
  slot_id: string;
  start_time: string;
  end_time: string;
}

export class ConflictError extends Error {
  code = '23505';
  constructor(message = 'Phòng đã được đặt bởi người khác, vui lòng chọn slot khác.') {
    super(message);
    this.name = 'ConflictError';
  }
}

export const useCreateBooking = () => {
  const qc = useQueryClient();
  const user = useBookingStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CreateBookingInput): Promise<BookingCreatedPayload> => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user?.id ?? '',
          room_id: input.room_id,
          date_iso: input.date_iso,
          slot_id: input.slot_id,
          start_time: input.start_time,
          end_time: input.end_time,
          status: 'confirmed',
        })
        .select('id, room_id, date_iso, slot_id, start_time, end_time')
        .single();

      if (error) {
        const pgError = error as PostgrestError;
        if (pgError.code === '23505') {
          throw new ConflictError();
        }
        throw error;
      }
      return data as BookingCreatedPayload;
    },
    onSuccess: (res) => {
      invalidateBookings(qc, { roomId: res.room_id, dateIso: res.date_iso });
    },
    onError: (_err, vars) => {
      invalidateBookings(qc, { roomId: vars.room_id, dateIso: vars.date_iso });
    },
  });
};
