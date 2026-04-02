const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
    contact_phone: {
      type: String,
      default: null,
    },
    contact_email: {
      type: String,
      default: null,
    },
    contact_whatsapp: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'expired', 'rejected', 'deleted', 'scheduled'],
      default: 'draft',
    },
    publish_at: {
      type: Date,
      default: () => new Date(),
    },
    expire_at: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 30); // Default 30 days
        return d;
      },
    },
    view_count: {
      type: Number,
      default: 0,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    featured_until: {
      type: Date,
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
adSchema.index({ user_id: 1 });
adSchema.index({ status: 1 });
adSchema.index({ category_id: 1 });
adSchema.index({ city_id: 1 });
adSchema.index({ publish_at: 1 });
adSchema.index({ expire_at: 1 });
adSchema.index({ is_featured: 1 });

module.exports = mongoose.model('Ad', adSchema);
