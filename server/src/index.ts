import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import availabilityRoutes from './routes/availability.js';
import bookingRoutes from './routes/bookings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const PORT = Number(process.env.PORT) || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onestop';
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);

if (isProduction) {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function start() {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (isProduction) console.log('Serving frontend from dist/');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
