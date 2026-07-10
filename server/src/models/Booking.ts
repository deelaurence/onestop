import mongoose from 'mongoose';

export type BookingType = 'studio' | 'event';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IBooking {
  name: string;
  phone: string;
  email: string;
  description: string;
  type: BookingType;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new mongoose.Schema<IBooking>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: ['studio', 'event'], required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true },
);

bookingSchema.index({ date: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ email: 1, date: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
