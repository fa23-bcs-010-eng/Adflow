const mongoose = require('mongoose');
const {
  User,
  SellerProfile,
  Package,
  Category,
  City,
  Ad,
  AdMedia,
  Payment,
  Notification,
  AuditLog,
  AdStatusHistory,
  LearningQuestion,
  SystemHealthLog,
} = require('../models');

/**
 * Initialize MongoDB and ensure all indexes are created
 */
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing MongoDB collections...');

    const models = [
      User,
      SellerProfile,
      Package,
      Category,
      City,
      Ad,
      AdMedia,
      Payment,
      Notification,
      AuditLog,
      AdStatusHistory,
      LearningQuestion,
      SystemHealthLog,
    ];

    // Ensure indexes are created (Mongoose handles this automatically)
    console.log('✅ Database collections ready');

    // Check collection counts
    const counts = {};
    for (const model of models) {
      counts[model.collection.name] = await model.countDocuments();
    }

    console.log('📊 Collection counts:', counts);

    return {
      success: true,
      collections: Object.keys(counts).length,
      counts,
    };
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't throw - allow server to start even if initialization fails
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    const stats = {
      users: await User.countDocuments(),
      seller_profiles: await SellerProfile.countDocuments(),
      packages: await Package.countDocuments(),
      categories: await Category.countDocuments(),
      cities: await City.countDocuments(),
      ads: await Ad.countDocuments(),
      ad_media: await AdMedia.countDocuments(),
      payments: await Payment.countDocuments(),
      notifications: await Notification.countDocuments(),
      audit_logs: await AuditLog.countDocuments(),
      ad_status_history: await AdStatusHistory.countDocuments(),
      learning_questions: await LearningQuestion.countDocuments(),
      system_health_logs: await SystemHealthLog.countDocuments(),
    };

    return stats;
  } catch (error) {
    console.error('Error fetching database stats:', error.message);
    throw error;
  }
};

/**
 * Get MongoDB connection info
 */
const getMongoInfo = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        connected: false,
        message: 'Not connected to MongoDB',
      };
    }

    const adminDb = mongoose.connection.getClient().db('admin');
    const serverStatus = await adminDb.admin().serverStatus();

    return {
      connected: true,
      version: serverStatus.version,
      uptime_seconds: serverStatus.uptime,
      memory_mb: serverStatus.mem.resident,
      current_connections: serverStatus.connections.current,
    };
  } catch (error) {
    console.error('Error fetching MongoDB info:', error.message);
    return {
      connected: false,
      error: error.message,
    };
  }
};

module.exports = {
  initializeDatabase,
  getDatabaseStats,
  getMongoInfo,
};
