const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /.+\@.+\..+/,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['client', 'moderator', 'admin', 'super_admin'],
      default: 'client',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
    },
    last_login: {
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

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);
