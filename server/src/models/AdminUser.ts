import mongoose from 'mongoose';

export interface IAdminUser {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new mongoose.Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const AdminUser = mongoose.model<IAdminUser>('AdminUser', adminSchema);
