const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'error', 'success', 'ad_review', 'payment', 'system'],
      default: 'info',
    },
    link: {
      type: String,
      default: null,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
    related_id: {
      type: mongoose.Schema.Types.ObjectId,
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

notificationSchema.index({ user_id: 1 });
notificationSchema.index({ is_read: 1 });
notificationSchema.index({ created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
