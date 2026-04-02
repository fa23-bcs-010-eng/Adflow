const mongoose = require('mongoose');

const mongoState = {
  enabled: false,
  connected: false,
  error: null,
};

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI;
  const enableFlag = String(process.env.MONGODB_ENABLE || '').toLowerCase() === 'true';
  const enabled = enableFlag || Boolean(uri);

  mongoState.enabled = enabled;

  if (!enabled) {
    console.log('[MongoDB] Disabled (set MONGODB_ENABLE=true or provide MONGODB_URI)');
    return mongoState;
  }

  if (!uri) {
    mongoState.enabled = false;
    mongoState.connected = false;
    mongoState.error = 'MONGODB_URI is missing';
    console.warn('[MongoDB] MONGODB_ENABLE=true but MONGODB_URI is not set. Skipping MongoDB connection.');
    return mongoState;
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      serverSelectionTimeoutMS: 5000,
    });

    mongoState.connected = true;
    mongoState.error = null;
    console.log(`[MongoDB] Connected (${mongoose.connection.name})`);
  } catch (error) {
    mongoState.connected = false;
    mongoState.error = error?.message || 'Unknown MongoDB connection error';
    console.error('[MongoDB] Connection failed:', mongoState.error);
  }

  return mongoState;
};

const getMongoState = () => ({
  ...mongoState,
  readyState: mongoose.connection.readyState,
});

module.exports = {
  connectMongo,
  getMongoState,
};
