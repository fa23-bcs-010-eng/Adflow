const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    ad_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
    },
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'jazz_cash', 'easypaisa', 'card', 'crypto', 'other'],
      default: 'bank_transfer',
    },
    transaction_ref: {
      type: String,
      default: null,
    },
    sender_name: {
      type: String,
      default: null,
    },
    sender_bank_name: {
      type: String,
      default: null,
    },
    sender_account_number: {
      type: String,
      default: null,
    },
    sender_iban: {
      type: String,
      default: null,
    },
    screenshot_url: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verified_at: {
      type: Date,
      default: null,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejection_note: {
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

paymentSchema.index({ ad_id: 1 });
paymentSchema.index({ user_id: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ created_at: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
