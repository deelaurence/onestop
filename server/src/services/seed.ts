import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser.js';
import { AvailabilityOverride } from '../models/AvailabilityOverride.js';

export async function seedDatabase(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@onestopphotography.org';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'onestop2026';
  const adminName = process.env.ADMIN_NAME ?? 'Onestop Admin';

  const existingAdmin = await AdminUser.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await AdminUser.create({ email: adminEmail, passwordHash, name: adminName });
    console.log(`Seeded admin user: ${adminEmail}`);
  }

  const overrideCount = await AvailabilityOverride.countDocuments();
  if (overrideCount === 0) {
    const today = new Date();
    const blockDate = new Date(today);
    blockDate.setDate(blockDate.getDate() + 14);
    const openDate = new Date(today);
    openDate.setDate(openDate.getDate() + 7);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    await AvailabilityOverride.insertMany([
      {
        startDate: fmt(blockDate),
        endDate: fmt(blockDate),
        type: 'all',
        available: false,
        note: 'Studio maintenance — blocked for all session types',
      },
      {
        startDate: fmt(openDate),
        endDate: fmt(openDate),
        type: 'event',
        available: true,
        startTime: '08:00',
        endTime: '14:00',
        note: 'Special Sunday morning window opened for events',
      },
    ]);
    console.log('Seeded sample availability overrides');
  }
}
