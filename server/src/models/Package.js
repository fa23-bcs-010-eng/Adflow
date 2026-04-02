const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    duration_days: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      default: 1,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: 'local',
    },
    response_ms: {
      type: Number,
      default: 0,
    },
    checked_at: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'deprecated'],
      default: 'available',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

packageSchema.index({ is_active: 1 });
packageSchema.index({ is_featured: 1 });

module.exports = mongoose.model('Package', packageSchema);
