import type { Room, TimeSlot } from '../types';

const roomsData: Omit<Room, 'image'>[] = [
  { id: '1', name: 'Lab A3-101', building: 'Building A3', type: 'lab', seats: 30, status: 'available', amenities: ['Projector', 'Whiteboard', 'AC', 'WiFi'], floor: 1 },
  { id: '2', name: 'Library Zone B', building: 'Main Library', type: 'library', seats: 50, status: 'occupied', amenities: ['Quiet Zone', 'WiFi', 'Power Outlets'], floor: 2 },
  { id: '3', name: 'Study Room C1', building: 'Building C', type: 'study_room', seats: 8, status: 'available', amenities: ['Whiteboard', 'WiFi', 'AC'], floor: 1 },
  { id: '4', name: 'Classroom B2-204', building: 'Building B2', type: 'classroom', seats: 40, status: 'available', amenities: ['Projector', 'Speakers', 'AC', 'WiFi'], floor: 2 },
  { id: '5', name: 'Lab A1-305', building: 'Building A1', type: 'lab', seats: 25, status: 'maintenance', amenities: ['Computers', 'Projector', 'AC'], floor: 3 },
  { id: '6', name: 'Auditorium D', building: 'Building D', type: 'auditorium', seats: 200, status: 'available', amenities: ['Stage', 'Sound System', 'Projector', 'AC'], floor: 1 },
  { id: '7', name: 'Study Room C2', building: 'Building C', type: 'study_room', seats: 6, status: 'available', amenities: ['Whiteboard', 'WiFi'], floor: 2 },
  { id: '8', name: 'Library Zone A', building: 'Main Library', type: 'library', seats: 60, status: 'available', amenities: ['Quiet Zone', 'WiFi', 'Power Outlets', 'AC'], floor: 1 },
  { id: '9', name: 'Classroom A2-102', building: 'Building A2', type: 'classroom', seats: 35, status: 'occupied', amenities: ['Projector', 'Whiteboard', 'WiFi'], floor: 1 },
  { id: '10', name: 'Lab B1-201', building: 'Building B1', type: 'lab', seats: 20, status: 'available', amenities: ['Computers', 'AC', 'WiFi'], floor: 2 },
  { id: '11', name: 'Study Room C3', building: 'Building C', type: 'study_room', seats: 10, status: 'occupied', amenities: ['TV Screen', 'Whiteboard', 'AC'], floor: 3 },
  { id: '12', name: 'Library Zone C', building: 'Main Library', type: 'library', seats: 40, status: 'available', amenities: ['Discussion Area', 'WiFi', 'Power Outlets'], floor: 3 },
  { id: '13', name: 'Classroom D-301', building: 'Building D', type: 'classroom', seats: 45, status: 'available', amenities: ['Projector', 'AC', 'WiFi', 'Speakers'], floor: 3 },
  { id: '14', name: 'Lab A3-402', building: 'Building A3', type: 'lab', seats: 28, status: 'available', amenities: ['Projector', 'Lab Equipment', 'AC'], floor: 4 },
  { id: '15', name: 'Study Room A1-1', building: 'Building A1', type: 'study_room', seats: 4, status: 'available', amenities: ['WiFi', 'Power Outlets'], floor: 1 },
  { id: '16', name: 'Auditorium B', building: 'Building B', type: 'auditorium', seats: 150, status: 'occupied', amenities: ['Stage', 'Sound System', 'Projector'], floor: 2 },
  { id: '17', name: 'Classroom C-105', building: 'Building C', type: 'classroom', seats: 50, status: 'available', amenities: ['Interactive Board', 'Projector', 'AC'], floor: 1 },
  { id: '18', name: 'Lab D-101', building: 'Building D', type: 'lab', seats: 32, status: 'available', amenities: ['Computers', 'WiFi', 'AC', 'Projector'], floor: 1 },
  { id: '19', name: 'Study Room B2-1', building: 'Building B2', type: 'study_room', seats: 12, status: 'available', amenities: ['Whiteboard', 'AC', 'WiFi', 'TV'], floor: 2 },
  { id: '20', name: 'Library Reading Room', building: 'Main Library', type: 'library', seats: 80, status: 'available', amenities: ['Silent Zone', 'WiFi', 'Natural Light'], floor: 4 },
  { id: '21', name: 'Lab A2-203', building: 'Building A2', type: 'lab', seats: 22, status: 'occupied', amenities: ['Lab Equipment', 'AC', 'WiFi'], floor: 2 },
  { id: '22', name: 'Classroom A1-401', building: 'Building A1', type: 'classroom', seats: 38, status: 'available', amenities: ['Projector', 'Whiteboard', 'AC', 'WiFi'], floor: 4 },
  { id: '23', name: 'Study Room D-Lounge', building: 'Building D', type: 'study_room', seats: 15, status: 'available', amenities: ['Sofas', 'WiFi', 'Coffee Machine'], floor: 2 },
  { id: '24', name: 'Lab C-301', building: 'Building C', type: 'lab', seats: 26, status: 'maintenance', amenities: ['Computers', 'Projector', 'AC'], floor: 3 },
];

const imagePrompt = (type: string, name: string): string => {
  const base = encodeURIComponent(`modern ${type} interior, campus study room, clean design, bright lighting, minimalist furniture`);
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${base}&image_size=square_hd`;
};

export const mockRooms: Room[] = roomsData.map((room) => ({
  ...room,
  image: imagePrompt(room.type, room.name),
}));

export const mockTimeSlots: TimeSlot[] = [
  { id: 't1', startTime: '07:00', endTime: '08:00', available: true },
  { id: 't2', startTime: '08:00', endTime: '09:00', available: true },
  { id: 't3', startTime: '09:00', endTime: '10:00', available: false },
  { id: 't4', startTime: '10:00', endTime: '11:00', available: true },
  { id: 't5', startTime: '11:00', endTime: '12:00', available: true },
  { id: 't6', startTime: '12:00', endTime: '13:00', available: true },
  { id: 't7', startTime: '13:00', endTime: '14:00', available: false },
  { id: 't8', startTime: '14:00', endTime: '15:00', available: true },
  { id: 't9', startTime: '15:00', endTime: '16:00', available: true },
  { id: 't10', startTime: '16:00', endTime: '17:00', available: true },
  { id: 't11', startTime: '17:00', endTime: '18:00', available: false },
  { id: 't12', startTime: '18:00', endTime: '19:00', available: true },
  { id: 't13', startTime: '19:00', endTime: '20:00', available: true },
  { id: 't14', startTime: '20:00', endTime: '21:00', available: true },
];

export const fetchRooms = (): Promise<Room[]> =>
  new Promise((resolve) => setTimeout(() => resolve(mockRooms), 300));

export const fetchTimeSlots = (_roomId: string): Promise<TimeSlot[]> =>
  new Promise((resolve) => setTimeout(() => resolve(mockTimeSlots), 200));
