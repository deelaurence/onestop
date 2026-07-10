import mongoose from 'mongoose';

export type OverrideType = 'studio' | 'event' | 'all';

export interface IAvailabilityOverride {
  startDate: string;
  endDate: string;
  type: OverrideType;
  startTime?: string;
  endTime?: string;
  available: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const overrideSchema = new mongoose.Schema<IAvailabilityOverride>(
  {
    startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    type: { type: String, enum: ['studio', 'event', 'all'], default: 'all' },
    startTime: { type: String, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, match: /^\d{2}:\d{2}$/ },
    available: { type: Boolean, required: true },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

overrideSchema.index({ startDate: 1, endDate: 1 });

export const AvailabilityOverride = mongoose.model<IAvailabilityOverride>(
  'AvailabilityOverride',
  overrideSchema,
);
