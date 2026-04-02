const mongoose = require('mongoose');

const adStatusHistorySchema = new mongoose.Schema(
  {
    ad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
    },
    previous_status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'expired', 'rejected', 'deleted', 'scheduled'],
      default: null,
    },
    new_status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'expired', 'rejected', 'deleted', 'scheduled'],
      required: true,
    },
    changed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      enum: ['manual', 'automatic', 'moderation', 'payment', 'expiration', 'user_request'],
      default: 'manual',
    },
  },
  {
    timestamps: {
      createdAt: 'changed_at',
      updatedAt: 'updated_at',
    },
  }
);

adStatusHistorySchema.index({ ad_id: 1 });
adStatusHistorySchema.index({ changed_at: -1 });

module.exports = mongoose.model('AdStatusHistory', adStatusHistorySchema);
