const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: [true, 'Student name is required']
  },
  admissionNumber: {
    type: String,
    required: [true, 'Admission number is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    required: [true, 'Paid amount is required'],
    min: [0, 'Paid amount cannot be negative'],
    default: 0
  },
  balanceAmount: {
    type: Number,
    min: [0, 'Balance amount cannot be negative']
  },
  paymentType: {
    type: String,
    enum: ['Cash', 'Cheque', 'Credit Card', 'Debit Card', 'Online Banking', 'UPI'],
    required: [true, 'Payment type is required']
  },
  upiNumber: {
    type: String,
    default: ''
  },
  feeType: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'one-time'],
    default: 'monthly'
  },
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  paymentHistory: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    paymentType: String,
    upiNumber: {
      type: String,
      default: ''
    },
    remarks: String
  }]
}, {
  timestamps: true
});

// Calculate balance and status before saving
feePaymentSchema.pre('save', function(next) {
  // Calculate balance
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update status based on payment and due date
  const now = new Date();
  if (this.paidAmount >= this.totalAmount) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = new Date(this.dueDate) < now ? 'overdue' : 'partial';
  } else {
    this.status = new Date(this.dueDate) < now ? 'overdue' : 'pending';
  }
  
  next();
});

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = FeePayment;