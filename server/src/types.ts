export type BookingType = 'studio' | 'event';

export interface TimeWindow {
  start: string;
  end: string;
}

export interface DayAvailability {
  date: string;
  available: boolean;
  booked: boolean;
  slotCount: number;
  hours: TimeWindow | null;
}
