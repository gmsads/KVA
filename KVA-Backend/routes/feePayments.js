const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');

// Create a new fee payment
router.post('/', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Validate UPI number if payment type is UPI
    if (paymentData.paymentType === 'UPI') {
      if (!paymentData.upiNumber || !/^[\w.-]+@[\w]+$/.test(paymentData.upiNumber)) {
        return res.status(400).json({ message: 'Please provide a valid UPI ID (e.g., name@upi)' });
      }
    }

    // If adding an installment to an existing payment
    if (paymentData.isInstallment && paymentData._id) {
      const existingPayment = await FeePayment.findById(paymentData._id);
      
      if (!existingPayment) {
        return res.status(404).json({ message: 'Original payment not found' });
      }
      
      // Update the existing payment
      const updatedPaidAmount = existingPayment.paidAmount + paymentData.paidAmount;
      const updatedBalance = existingPayment.totalAmount - updatedPaidAmount;
      
      const updateData = {
        paidAmount: updatedPaidAmount,
        balanceAmount: updatedBalance,
        status: updatedBalance <= 0 ? 'paid' : 'partial',
        paymentType: paymentData.paymentType,
        remarks: paymentData.remarks || existingPayment.remarks
      };
      
      // Only update UPI number if payment type is UPI
      if (paymentData.paymentType === 'UPI') {
        updateData.upiNumber = paymentData.upiNumber;
      } else {
        // Clear UPI number if payment type is not UPI
        updateData.upiNumber = '';
      }
      
      const updatedPayment = await FeePayment.findByIdAndUpdate(
        paymentData._id,
        updateData,
        { new: true }
      );
      
      // Add to payment history
      updatedPayment.paymentHistory.push({
        amount: paymentData.paidAmount,
        date: new Date(),
        paymentType: paymentData.paymentType,
        upiNumber: paymentData.paymentType === 'UPI' ? paymentData.upiNumber : '',
        remarks: paymentData.remarks
      });
      
      await updatedPayment.save();
      
      return res.status(200).json(updatedPayment);
    }
    
    // Create new payment
    const newPayment = new FeePayment({
      ...paymentData,
      balanceAmount: paymentData.totalAmount - (paymentData.paidAmount || 0),
      status: paymentData.paidAmount >= paymentData.totalAmount ? 'paid' : 
             (paymentData.paidAmount > 0 ? 'partial' : 'pending'),
      // Ensure UPI number is empty if not UPI payment
      upiNumber: paymentData.paymentType === 'UPI' ? paymentData.upiNumber : ''
    });

    // Add initial payment to history if paidAmount > 0
    if (paymentData.paidAmount > 0) {
      newPayment.paymentHistory.push({
        amount: paymentData.paidAmount,
        date: new Date(),
        paymentType: paymentData.paymentType,
        upiNumber: paymentData.paymentType === 'UPI' ? paymentData.upiNumber : '',
        remarks: paymentData.remarks
      });
    }

    await newPayment.save();
    
    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all fee payments with filtering options
router.get('/', async (req, res) => {
  try {
    const { status, studentName, admissionNumber, dateFrom, dateTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (studentName) query.studentName = { $regex: studentName, $options: 'i' };
    if (admissionNumber) query.admissionNumber = admissionNumber;
    
    // Date range filtering
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const payments = await FeePayment.find(query).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single fee payment with detailed information
router.get('/:id', async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a fee payment
router.put('/:id', async (req, res) => {
  try {
    const paymentData = req.body;

    // Validate UPI number if payment type is UPI
    if (paymentData.paymentType === 'UPI') {
      if (!paymentData.upiNumber || !/^[\w.-]+@[\w]+$/.test(paymentData.upiNumber)) {
        return res.status(400).json({ message: 'Please provide a valid UPI ID (e.g., name@upi)' });
      }
    }

    // Calculate new balance and status
    const existingPayment = await FeePayment.findById(req.params.id);
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const totalAmount = paymentData.totalAmount !== undefined ? 
                       paymentData.totalAmount : existingPayment.totalAmount;
    const paidAmount = paymentData.paidAmount !== undefined ? 
                       paymentData.paidAmount : existingPayment.paidAmount;

    paymentData.balanceAmount = totalAmount - paidAmount;
    paymentData.status = paidAmount >= totalAmount ? 'paid' : 
                        (paidAmount > 0 ? 'partial' : 'pending');
    
    // Ensure UPI number is handled correctly
    if (paymentData.paymentType !== 'UPI') {
      paymentData.upiNumber = '';
    }

    const updatedPayment = await FeePayment.findByIdAndUpdate(
      req.params.id,
      paymentData,
      { new: true }
    );
    
    res.json(updatedPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a fee payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await FeePayment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payment summary statistics with filtering options
router.get('/summary/stats', async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const matchQuery = {};

    if (status) matchQuery.status = status;
    
    // Date range filtering
    if (dateFrom || dateTo) {
      matchQuery.date = {};
      if (dateFrom) matchQuery.date.$gte = new Date(dateFrom);
      if (dateTo) matchQuery.date.$lte = new Date(dateTo);
    }

    const stats = await FeePayment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalBalance: { $sum: "$balanceAmount" },
          count: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] }
          },
          partialCount: {
            $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
        count: 0,
        paidCount: 0,
        partialCount: 0,
        pendingCount: 0
      });
    }
    
    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payment history for a specific student
router.get('/student/:admissionNumber', async (req, res) => {
  try {
    const payments = await FeePayment.find({ 
      admissionNumber: req.params.admissionNumber 
    }).sort({ date: -1 });
    
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;