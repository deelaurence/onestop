export type BookingType = 'studio' | 'event';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  date: string;
  available: boolean;
  slotCount: number;
}
