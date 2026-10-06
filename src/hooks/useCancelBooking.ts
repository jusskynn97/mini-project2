import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { invalidateBookings } from './useBookings';
import { useBookingStore } from '../store/bookingStore';

export interface CancelBookingInput {
  bookingId: string;
  roomId?: string;
  dateIso?: string;
}

export const useCancelBooking = () => {
  const qc = useQueryClient();
  const user = useBookingStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: CancelBookingInput): Promise<boolean> => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', input.bookingId)
        .eq('user_id', user?.id ?? '');
      if (error) throw error;
      return true;
    },
    onSuccess: (_ok, vars) => {
      invalidateBookings(qc, { roomId: vars.roomId, dateIso: vars.dateIso });
    },
  });
};
