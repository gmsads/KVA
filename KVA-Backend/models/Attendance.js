const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  admissionNo: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  image: {
    type: String // Store the captured image if needed
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ admissionNo: 1 });
attendanceSchema.index({ studentName: 1 }); // Added index for student name searches

module.exports = mongoose.model('Attendance', attendanceSchema);