const mongoose = require('mongoose');

const sellerProfileSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    display_name: {
      type: String,
      trim: true,
    },
    business_name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    verified_at: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    profile_image_url: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    total_ads: {
      type: Number,
      default: 0,
    },
    response_time_hours: {
      type: Number,
      default: 24,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Indexes (user_id has unique constraint, add others for common queries)
sellerProfileSchema.index({ is_verified: 1 });

module.exports = mongoose.model('SellerProfile', sellerProfileSchema);
