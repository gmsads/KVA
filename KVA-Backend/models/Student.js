const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  testType: String,
  date: Date,
  month: String,
  year: String,
  subjects: [{
    name: String,
    score: Number,
    total: Number,
    grade: String
  }],
  grade: String,
  performance: String,
  lastTest: Date
});

const studentSchema = new mongoose.Schema({
  admissionNo: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  level: {
    type: String,
    enum: ['primary', 'secondary', 'high-school', 'senior'],
    required: true
  },
  class: {
    type: String,
    required: true
  },
  school: {
    type: String,
    required: true
  },
  board: {
    type: String,
    enum: ['cbse', 'icse', 'state', 'ib', 'igcse'],
    required: true
  },
  parentName: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true,
    set: v => (v && !v.startsWith('+91') ? `+91${v}` : v),
    validate: {
      validator: function(v) {
        return /^\+91\d{10}$/.test(v);
      },
      message: 'Parent phone must be a valid 10-digit Indian number with +91'
    }
  },

  address: {
    type: String,
    required: true
  },
  dateOfAdmission: {
    type: Date,
    required: true
  },
  feeParticulars: String,
  academicReport: String,
  subjects: [String],
  joiningDate: {
    type: Date,
    
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred'],
    default: 'active'
  },
  aadhaarNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\d{12}$/.test(v);
      },
      message: 'Aadhaar number must be 12 digits'
    }
  },
  admissionReference: {
    type: String,
    enum: ['walk-in', 'referral', 'online-ad', 'social-media', 'other']
  },
  referralPersonName: String,
  faceDescriptor: {
    type: [Number],
    select: false // Don't include in queries by default for security
  },
  performances: [performanceSchema]
}, {
  timestamps: true
});

// Index for better query performance
studentSchema.index({ admissionNo: 1 });
studentSchema.index({ firstName: 1, lastName: 1 });
studentSchema.index({ class: 1, status: 1 });

module.exports = mongoose.model('Student', studentSchema);