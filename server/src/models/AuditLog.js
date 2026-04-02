const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action_type: {
      type: String,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'approve',
        'reject',
        'publish',
        'expire',
        'verify_payment',
        'login',
        'logout',
      ],
      required: true,
    },
    target_type: {
      type: String,
      enum: ['user', 'ad', 'payment', 'package', 'category', 'notification'],
      required: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    old_value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    new_value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    details: {
      type: String,
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

auditLogSchema.index({ actor_id: 1 });
auditLogSchema.index({ action_type: 1 });
auditLogSchema.index({ target_type: 1 });
auditLogSchema.index({ created_at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
