const mongoose = require('mongoose');

const adMediaSchema = new mongoose.Schema(
  {
    ad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
    },
    source_type: {
      type: String,
      enum: ['upload', 'url', 'youtube'],
      default: 'url',
    },
    original_url: {
      type: String,
      required: true,
    },
    thumbnail_url: {
      type: String,
      default: null,
    },
    media_type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    validation_status: {
      type: String,
      enum: ['pending', 'valid', 'invalid', 'deleted'],
      default: 'pending',
    },
    file_size_bytes: {
      type: Number,
      default: null,
    },
    display_order: {
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

adMediaSchema.index({ ad_id: 1 });
adMediaSchema.index({ validation_status: 1 });

module.exports = mongoose.model('AdMedia', adMediaSchema);
