const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastTest: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  grade: {
    type: String,
    default: 'N/A'
  },
  performance: {
    type: String,
    enum: ['strong', 'average', 'weak'],
    default: 'weak'
  }
});

const weeklyTestSchema = new mongoose.Schema({
  week: {
    type: String,
    required: true
  },
  math: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  physics: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  chemistry: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  english: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

const monthlyTestSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  math: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  physics: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  chemistry: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  english: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
});

const scholarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    required: true,
    enum: ['primary', 'secondary', 'highschool', 'senior']
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  rollNumber: {
    type: String,
    unique: true,
    trim: true
  },
  subjects: [subjectSchema],
  weeklyTests: [weeklyTestSchema],
  monthlyTests: [monthlyTestSchema],
  studentId: {
    type: String,
    unique: true,
    trim: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate roll number and studentId if not provided
scholarSchema.pre('save', async function(next) {
  try {
    if (!this.rollNumber || this.rollNumber === '') {
      const count = await this.constructor.countDocuments();
      this.rollNumber = `KVA${(count + 1).toString().padStart(3, '0')}`;
    }
    
    // Also set studentId to rollNumber if not provided
    if (!this.studentId || this.studentId === '') {
      this.studentId = this.rollNumber;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to calculate grade
scholarSchema.statics.calculateGrade = function(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Static method to determine performance
scholarSchema.statics.determinePerformance = function(score) {
  if (score >= 85) return 'strong';
  if (score >= 70) return 'average';
  return 'weak';
};

// Instance method to update grades and performance
scholarSchema.methods.updatePerformanceMetrics = function() {
  this.subjects.forEach(subject => {
    if (typeof subject.score === 'number') {
      subject.grade = this.constructor.calculateGrade(subject.score);
      subject.performance = this.constructor.determinePerformance(subject.score);
    }
  });
  return this;
};

// Add a virtual for average score
scholarSchema.virtual('averageScore').get(function() {
  if (!this.subjects || this.subjects.length === 0) return 0;
  const total = this.subjects.reduce((sum, subject) => sum + subject.score, 0);
  return total / this.subjects.length;
});

module.exports = mongoose.model('Scholar', scholarSchema);