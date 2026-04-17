const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true,
    enum: [
      'Principal',
      'Vice Principal',
      'Senior Teacher',
      'Junior Teacher',
      'Subject Teacher',
      'Administrative Officer',
      'Accountant',
      'Lab Assistant'
    ]
  },
  subjects: {
    type: [String],
    default: []
  },
  salary: {
    type: Number,
    required: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  phone: String,
  email: String,
  qualification: String,
  experience: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);