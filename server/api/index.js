const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Import your Express app
const app = require('../src/index');

// Connection cache
let isDbConnected = false;

const handler = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Connect to DB only once
  if (!isDbConnected) {
    try {
      const { connectMongo } = require('../src/config/mongodb');
      const { initializeDatabase } = require('../src/config/database');
      
      await connectMongo();
      await initializeDatabase();
      isDbConnected = true;
      console.log('[Vercel] Database connected');
    } catch (error) {
      console.error('[Vercel] DB error:', error.message);
    }
  }
  
  // Forward to Express
  return app(req, res);
};

module.exports = handler;