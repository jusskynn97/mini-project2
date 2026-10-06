export interface TimeSlotDefinition {
  slotId: string;
  startTime: string;
  endTime: string;
  label: string;
}

export const SLOT_DEFINITIONS: TimeSlotDefinition[] = [
  { slotId: 's0730', startTime: '07:30', endTime: '09:30', label: '07:30 – 09:30' },
  { slotId: 's0930', startTime: '09:30', endTime: '11:30', label: '09:30 – 11:30' },
  { slotId: 's1130', startTime: '11:30', endTime: '13:30', label: '11:30 – 13:30' },
  { slotId: 's1330', startTime: '13:30', endTime: '15:30', label: '13:30 – 15:30' },
  { slotId: 's1530', startTime: '15:30', endTime: '17:30', label: '15:30 – 17:30' },
  { slotId: 's1730', startTime: '17:30', endTime: '19:30', label: '17:30 – 19:30' },
  { slotId: 's1930', startTime: '19:30', endTime: '21:30', label: '19:30 – 21:30' },
];

export interface BuildSlotResult extends TimeSlotDefinition {
  startTimeISO: string;
  endTimeISO: string;
}

const pad2 = (n: number): string => n.toString().padStart(2, '0');

export const buildSlots = (dateIso: string): BuildSlotResult[] => {
  return SLOT_DEFINITIONS.map((s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const start = new Date(`${dateIso}T00:00:00`);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(`${dateIso}T00:00:00`);
    end.setHours(eh, em, 0, 0);
    return {
      ...s,
      startTimeISO: `${dateIso}T${pad2(sh)}:${pad2(sm)}:00`,
      endTimeISO: `${dateIso}T${pad2(eh)}:${pad2(em)}:00`,
    };
  });
};
