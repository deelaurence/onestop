import mongoose from 'mongoose';

export type BookingType = 'studio' | 'event';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IBookingActivity {
  action: string;
  detail?: string;
  by?: string;
  at: Date;
}

export interface IBooking {
  referenceCode: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  type: BookingType;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  fullDays?: boolean;
  status: BookingStatus;
  adminNote?: string;
  activityLog: IBookingActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new mongoose.Schema<IBookingActivity>(
  {
    action: { type: String, required: true },
    detail: { type: String },
    by: { type: String, default: 'system' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema<IBooking>(
  {
    referenceCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 25 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    type: { type: String, enum: ['studio', 'event'], required: true },
    startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    fullDays: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    activityLog: { type: [activitySchema], default: [] },
  },
  { timestamps: true },
);

bookingSchema.index({ startDate: 1, endDate: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ referenceCode: 1 }, { unique: true, sparse: true });

bookingSchema.pre('save', async function assignReferenceCode() {
  if (this.referenceCode) return;

  const BookingModel = this.constructor as typeof Booking;
  for (let attempt = 0; attempt < 8; attempt++) {
    const { generateReferenceCode } = await import('../services/reference-code.js');
    const code = generateReferenceCode();
    const exists = await BookingModel.exists({ referenceCode: code, _id: { $ne: this._id } });
    if (!exists) {
      this.referenceCode = code;
      return;
    }
  }
  throw new Error('Failed to generate reference code');
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
