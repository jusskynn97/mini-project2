import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Room } from '../types';

const imagePrompt = (type: string, name: string): string => {
  const base = encodeURIComponent(
    `modern ${type} interior, campus study room, clean design, bright lighting, minimalist furniture, ${name}`
  );
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${base}&image_size=square_hd`;
};

export const useRooms = () =>
  useQuery({
    queryKey: ['rooms'],
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase.from('rooms').select('*');
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        building: r.building?.trim() ?? 'A',
        type: r.type,
        seats: r.seats,
        status: r.status,
        image: r.image ?? imagePrompt(r.type, r.name),
        amenities: r.amenities ?? [],
        floor: r.floor,
      }));
    },
  });

export const useRoom = (roomId: string | undefined) =>
  useQuery({
    queryKey: ['rooms', roomId],
    queryFn: async (): Promise<Room | null> => {
      if (!roomId) return null;
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      if (error) return null;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        building: data.building?.trim() ?? 'A',
        type: data.type,
        seats: data.seats,
        status: data.status,
        image: data.image ?? imagePrompt(data.type, data.name),
        amenities: data.amenities ?? [],
        floor: data.floor,
      };
    },
    enabled: !!roomId,
  });
