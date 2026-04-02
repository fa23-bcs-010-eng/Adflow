const mongoose = require('mongoose');

const learningQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      enum: [
        'pricing',
        'payment',
        'posting',
        'moderation',
        'safety',
        'features',
        'general',
      ],
      default: 'general',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    display_order: {
      type: Number,
      default: 0,
    },
    views: {
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

learningQuestionSchema.index({ topic: 1 });
learningQuestionSchema.index({ is_active: 1 });

module.exports = mongoose.model('LearningQuestion', learningQuestionSchema);
