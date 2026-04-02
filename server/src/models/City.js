const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    country: {
      type: String,
      default: 'Pakistan',
    },
    province: {
      type: String,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    display_order: {
      type: Number,
      default: 0,
    },
    ad_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Indexes (slug has unique constraint, add others for common queries)
citySchema.index({ is_active: 1 });

module.exports = mongoose.model('City', citySchema);
