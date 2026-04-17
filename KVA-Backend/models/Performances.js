// models/Performances.js
const mongoose = require('mongoose');

const performancesSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  testType: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly']
  },
  date: {
    type: String,
    required: function() {
      return this.testType === 'weekly';
    }
  },
  week: {
    type: String,
    required: function() {
      return this.testType === 'weekly';
    }
  },
  month: {
    type: String,
    required: function() {
      return this.testType === 'monthly';
    }
  },
  year: {
    type: Number,
    required: true
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    total: {
      type: Number,
      default: 100
    },
    grade: {
      type: String,
      default: ''
    }
  }]
}, {
  timestamps: true
});

// Fix: Changed performanceSchema to performancesSchema
performancesSchema.index({ studentId: 1, testType: 1, week: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Performances', performancesSchema);