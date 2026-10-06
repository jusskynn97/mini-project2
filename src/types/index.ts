export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export type RoomType = 'lab' | 'library' | 'classroom' | 'study_room' | 'auditorium';

export interface Room {
  id: string;
  name: string;
  building: string;
  type: RoomType;
  seats: number;
  status: RoomStatus;
  image: string;
  amenities: string[];
  floor: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  date: string;
  timeSlot: TimeSlot;
  userId: string;
  status: 'confirmed' | 'cancelled' | 'pending';
}
