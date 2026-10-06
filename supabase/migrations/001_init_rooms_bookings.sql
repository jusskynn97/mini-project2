create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  building char(1) not null check (building in ('A','B','C','V')),
  type text not null check (type in ('lab','library','classroom','study_room','auditorium')),
  seats int not null check (seats > 0),
  status text not null default 'available' check (status in ('available','occupied','maintenance')),
  image text,
  amenities text[] not null default '{}',
  floor int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  date_iso date not null,
  slot_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','pending')),
  created_at timestamptz not null default now()
);

create unique index if not exists bookings_active_unique
  on public.bookings(room_id, date_iso, slot_id)
  where status = 'confirmed';

alter table public.rooms enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Rooms are viewable by authenticated users." on public.rooms;
create policy "Rooms are viewable by authenticated users."
  on public.rooms for select
  using (auth.role() = 'authenticated');

drop policy if exists "Users can view their own bookings." on public.bookings;
create policy "Users can view their own bookings."
  on public.bookings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own bookings." on public.bookings;
create policy "Users can insert their own bookings."
  on public.bookings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bookings." on public.bookings;
create policy "Users can update their own bookings."
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.rooms (id, name, building, type, seats, status, amenities, floor) values
  ('00000000-0000-0000-0000-000000000001', 'Lab A3-101',      'A', 'lab',         30,  'available',   array['Projector','Whiteboard','AC','WiFi'],           1),
  ('00000000-0000-0000-0000-000000000002', 'Library Zone B',  'B', 'library',     50,  'occupied',    array['Quiet Zone','WiFi','Power Outlets'],             2),
  ('00000000-0000-0000-0000-000000000003', 'Study Room C1',   'C', 'study_room',  8,   'available',   array['Whiteboard','WiFi','AC'],                        1),
  ('00000000-0000-0000-0000-000000000004', 'Classroom B2-204','B', 'classroom',   40,  'available',   array['Projector','Speakers','AC','WiFi'],              2),
  ('00000000-0000-0000-0000-000000000005', 'Lab A1-305',      'A', 'lab',         25,  'maintenance', array['Computers','Projector','AC'],                    3),
  ('00000000-0000-0000-0000-000000000006', 'Auditorium V',    'V', 'auditorium',  200, 'available',   array['Stage','Sound System','Projector','AC'],         1),
  ('00000000-0000-0000-0000-000000000007', 'Study Room C2',   'C', 'study_room',  6,   'available',   array['Whiteboard','WiFi'],                             2),
  ('00000000-0000-0000-0000-000000000008', 'Library Zone A',  'A', 'library',     60,  'available',   array['Quiet Zone','WiFi','Power Outlets','AC'],        1),
  ('00000000-0000-0000-0000-000000000009', 'Classroom A2-102','A', 'classroom',   35,  'occupied',    array['Projector','Whiteboard','WiFi'],                 1),
  ('00000000-0000-0000-0000-000000000010', 'Lab B1-201',      'B', 'lab',         20,  'available',   array['Computers','AC','WiFi'],                         2),
  ('00000000-0000-0000-0000-000000000011', 'Study Room C3',   'C', 'study_room',  10,  'occupied',    array['TV Screen','Whiteboard','AC'],                   3),
  ('00000000-0000-0000-0000-000000000012', 'Library Zone C',  'C', 'library',     40,  'available',   array['Discussion Area','WiFi','Power Outlets'],        3),
  ('00000000-0000-0000-0000-000000000013', 'Classroom V-301', 'V', 'classroom',   45,  'available',   array['Projector','AC','WiFi','Speakers'],              3),
  ('00000000-0000-0000-0000-000000000014', 'Lab A3-402',      'A', 'lab',         28,  'available',   array['Projector','Lab Equipment','AC'],                4),
  ('00000000-0000-0000-0000-000000000015', 'Study Room A1-1', 'A', 'study_room',  4,   'available',   array['WiFi','Power Outlets'],                          1),
  ('00000000-0000-0000-0000-000000000016', 'Auditorium B',    'B', 'auditorium',  150, 'occupied',    array['Stage','Sound System','Projector'],              2),
  ('00000000-0000-0000-0000-000000000017', 'Classroom C-105', 'C', 'classroom',   50,  'available',   array['Interactive Board','Projector','AC'],            1),
  ('00000000-0000-0000-0000-000000000018', 'Lab V-101',       'V', 'lab',         32,  'available',   array['Computers','WiFi','AC','Projector'],             1),
  ('00000000-0000-0000-0000-000000000019', 'Study Room B2-1', 'B', 'study_room',  12,  'available',   array['Whiteboard','AC','WiFi','TV'],                   2),
  ('00000000-0000-0000-0000-000000000020', 'Library Reading', 'A', 'library',     80,  'available',   array['Silent Zone','WiFi','Natural Light'],            4),
  ('00000000-0000-0000-0000-000000000021', 'Lab A2-203',      'A', 'lab',         22,  'occupied',    array['Lab Equipment','AC','WiFi'],                     2),
  ('00000000-0000-0000-0000-000000000022', 'Classroom A1-401','A', 'classroom',   38,  'available',   array['Projector','Whiteboard','AC','WiFi'],            4),
  ('00000000-0000-0000-0000-000000000023', 'Study Room V-Lounge','V','study_room',15, 'available',   array['Sofas','WiFi','Coffee Machine'],                 2),
  ('00000000-0000-0000-0000-000000000024', 'Lab C-301',       'C', 'lab',         26,  'maintenance', array['Computers','Projector','AC'],                    3)
on conflict (id) do nothing;
