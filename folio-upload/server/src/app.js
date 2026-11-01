import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import projectRoutes from './routes/projects.js';
import skillRoutes from './routes/skills.js';
import messageRoutes from './routes/messages.js';
import publicRoutes from './routes/public.js';

const app = express();
app.set('trust proxy', 1);

const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json({ limit: '100kb' }));
app.use(logger);

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/public', publicRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
