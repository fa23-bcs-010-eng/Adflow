const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
    },
    icon: {
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
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
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

// Indexes (slug has unique constraint, add others for common queries)
categorySchema.index({ is_active: 1 });

module.exports = mongoose.model('Category', categorySchema);
