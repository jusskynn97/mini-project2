import { create } from 'zustand';
import type { UseBoundStore, StoreApi } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface SelectedTempSlot {
  roomId: string;
  date: string;
  slotId: string;
}

interface BookingState {
  user: AuthUser | null;
  hydrated: boolean;
  selectedTempSlot: SelectedTempSlot | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  hydrate: () => void;
  setSelectedTempSlot: (slot: SelectedTempSlot | null) => void;
  clearTempSlot: () => void;
}

type BookingStore = UseBoundStore<StoreApi<BookingState>>;

let storeRef: BookingStore | null = null;

const useBookingStoreImpl = create<BookingState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      selectedTempSlot: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, selectedTempSlot: null }),
      hydrate: () => set({ hydrated: true }),
      setSelectedTempSlot: (slot) => set({ selectedTempSlot: slot }),
      clearTempSlot: () => set({ selectedTempSlot: null }),
    }),
    {
      name: '@booking-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => () => {
        try {
          if (storeRef) {
            const s = storeRef.getState();
            if (!s.hydrated) s.hydrate();
          }
        } catch {
          // Fallback handled by RootNavigator useEffect timeout guard
        }
      },
    }
  )
);

storeRef = useBookingStoreImpl as BookingStore;

export const useBookingStore = useBookingStoreImpl;
