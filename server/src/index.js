const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load env
require('dotenv').config();

// Import your routes
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

// Global Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== HEALTH CHECK =====
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongo: getMongoState(),
    message: 'AdFlow API is running'
  });
});

// ===== TEST ROUTE =====
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'API is working!',
    available_routes: [
      '/api/health',
      '/api/auth/*',
      '/api/public/*',
      '/api/client/*',
      '/api/moderator/*',
      '/api/admin/*',
      '/api/cron/*',
      '/api/internal/*'
    ]
  });
});

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/internal', internalRoutes);

// ===== 404 Handler =====
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===== Error Handler =====
app.use(errorHandler);

// Export for Vercel
module.exports = app;

// For local development only
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  
  const bootstrap = async () => {
    console.log('\n🚀 Starting AdFlow Server...\n');
    
    // Connect to MongoDB (if enabled)
    await connectMongo();
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test\n`);
      
      // Start cron jobs (only if not in test mode)
      if (process.env.NODE_ENV !== 'test') {
        startCronJobs();
      }
    });
  };
  
  bootstrap().catch(error => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });
}