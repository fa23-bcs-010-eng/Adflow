const mongoose = require('mongoose');

const systemHealthLogSchema = new mongoose.Schema(
  {
    service: {
      type: String,
      enum: ['database', 'cron', 'cache', 'api', 'payment_gateway', 'email_service'],
      required: true,
    },
    status: {
      type: String,
      enum: ['healthy', 'degraded', 'down'],
      default: 'healthy',
    },
    response_time_ms: {
      type: Number,
      default: null,
    },
    error_message: {
      type: String,
      default: null,
    },
    error_details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    query: {
      type: String,
      default: null,
    },
    duration_ms: {
      type: Number,
      default: null,
    },
    affected_rows: {
      type: Number,
      default: null,
    },
    memory_usage_mb: {
      type: Number,
      default: null,
    },
    cpu_usage_percent: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

systemHealthLogSchema.index({ service: 1 });
systemHealthLogSchema.index({ status: 1 });
systemHealthLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('SystemHealthLog', systemHealthLogSchema);
