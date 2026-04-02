const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const clientRoutes = require('./routes/client.routes');
const moderatorRoutes = require('./routes/moderator.routes');
const adminRoutes = require('./routes/admin.routes');
const cronRoutes = require('./routes/cron.routes');
const internalRoutes = require('./routes/internal.routes');
const { connectMongo, getMongoState } = require('./config/mongodb');
const { initializeDatabase } = require('./config/database');

const { startCronJobs } = require('./cron/scheduler');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Global Middleware ─────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongo: getMongoState(),
  });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/internal', internalRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const bootstrap = async () => {
  await connectMongo();
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 AdFlow Pro server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'test') {
      startCronJobs();
    }
  });
};

bootstrap();

module.exports = app;
