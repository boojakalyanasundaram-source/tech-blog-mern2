import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { clientDist, uploadsDir } from './config/paths.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin/index.js';
import { seoRouter, htmlHandler } from './routes/seo.js';
import { startScheduler } from './jobs/scheduler.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();
app.set('trust proxy', 1);

// CSP is left to the hosting layer because articles embed YouTube/Vimeo and GA scripts; see README.
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
const allowedOrigins = new Set(env.clientUrls.filter(Boolean));
app.use(cors({
  origin(origin, callback) {
    // Requests from server-to-server clients and same-origin deployments have no Origin header.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api', notFound);

app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true }));
app.use(seoRouter);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: '7d' }));
  app.get('*', htmlHandler(clientDist));
} else {
  app.get('/', (_req, res) =>
    res.send('API is running. Start the React app with "npm run dev" (port 5174 or build it with "npm run build".')
  );
}

app.use(errorHandler);

connectDB()
  .then(() => {
    startScheduler();
    app.listen(env.port, () => console.log(`Server listening on http://localhost:${env.port}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
