import dotenv from 'dotenv';
import path from 'node:path';
import { existsSync } from 'node:fs';
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
const serveFrontend = process.env.SERVE_FRONTEND === 'true';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);

app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

if (!serveFrontend) {
  app.get('/', (_req, res) => {
    res.json({
      name: 'Onestop API',
      status: 'ok',
      health: '/api/health',
    });
  });
}

function resolveFrontendDist(): string {
  const candidates = [
    path.resolve(__dirname, '../public'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), '../dist'),
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return path.resolve(__dirname, '../public');
}

if (isProduction && serveFrontend) {
  const distPath = resolveFrontendDist();
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

async function start() {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (isProduction && serveFrontend) console.log('Serving frontend from public/');
    if (isProduction && !serveFrontend) console.log('API-only mode');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
