const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Create a new student
router.post('/', async (req, res) => {
  try {

     // Ensure parentPhone always has +91
     if (req.body.parentPhone && !req.body.parentPhone.startsWith('+91')) {
      req.body.parentPhone = `+91${req.body.parentPhone}`;
    }
    // Check if admission number already exists
    const existingStudent = await Student.findOne({ admissionNo: req.body.admissionNo });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Admission number already exists'
      });
    }

    // Validate Aadhaar number if provided
    if (req.body.aadhaarNumber && !/^\d{12}$/.test(req.body.aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number must be exactly 12 digits'
      });
    }

    // Convert date strings to Date objects
    const studentData = {
      ...req.body,
      faceDescriptor: req.body.faceDescriptor, // Ensure face descriptor is included
      dateOfBirth: new Date(req.body.dateOfBirth),
      dateOfAdmission: new Date(req.body.dateOfAdmission),
      joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : new Date()
    };

    const student = new Student(studentData);
    await student.save();
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    console.error('Error creating student:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
});

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Get a single student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
});

// Update a student
router.put('/:id', async (req, res) => {
  try {
    // Validate Aadhaar number if provided
    if (req.body.aadhaarNumber && !/^\d{12}$/.test(req.body.aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number must be exactly 12 digits'
      });
    }

    // Check if admission number is being changed to one that already exists
    if (req.body.admissionNo) {
      const existingStudent = await Student.findOne({ 
        admissionNo: req.body.admissionNo, 
        _id: { $ne: req.params.id } 
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Admission number already exists'
        });
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
});

// Update student status
router.patch('/:id/status', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

router.post('/:id/performance', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { testType, date, month, year, subjects } = req.body;

    const newPerformance = {
      testType,
      date,
      month,
      year,
      subjects,
      grade: 'Pending',
      performance: 'Pending',
      lastTest: new Date()
    };

    student.performances.push(newPerformance);
    await student.save();

    res.status(201).json(newPerformance);
  } catch (err) {
    console.error('Error in POST /:id/performance:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.get('/students/:id/performance', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const performances = await Performance.find({ studentId: req.params.id }).sort({ year: -1, month: -1, date: -1 });
    res.status(200).json({ success: true, data: performances });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching performance data', error: err.message });
  }
});

// POST: Add performance
router.post('/students/:id/performance', async (req, res) => {
  try {
    const { testType, date, month, year, subjects } = req.body;
    if (!testType || !date || !month || !year || !subjects) return res.status(400).json({ success: false, message: 'Missing required fields' });
    if (!Array.isArray(subjects) || subjects.length === 0) return res.status(400).json({ success: false, message: 'Subjects must be a non-empty array' });

    for (const subject of subjects) {
      if (!subject.name || typeof subject.score !== 'number' || subject.score < 0 || subject.score > 100)
        return res.status(400).json({ success: false, message: 'Invalid subject data' });
    }

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const performance = new Performance({ studentId: req.params.id, testType, date, month, year, subjects });
    await performance.save();
    res.status(201).json({ success: true, message: 'Performance data added successfully', data: performance });
  } catch (err) {
    console.error('Error adding performance data:', err);
    res.status(500).json({ success: false, message: 'Error adding performance data', error: err.message });
  }
});

// PUT: Update performance
router.put('/performance/:id', async (req, res) => {
  try {
    const { subjects } = req.body;
    if (subjects && Array.isArray(subjects)) {
      for (const subject of subjects) {
        if (!subject.name || typeof subject.score !== 'number' || subject.score < 0 || subject.score > 100)
          return res.status(400).json({ success: false, message: 'Invalid subject data' });
      }
    }

    const performance = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!performance) return res.status(404).json({ success: false, message: 'Performance record not found' });

    res.status(200).json({ success: true, message: 'Performance data updated successfully', data: performance });
  } catch (err) {
    console.error('Error updating performance data:', err);
    res.status(500).json({ success: false, message: 'Error updating performance data', error: err.message });
  }
});

// DELETE: Performance
router.delete('/performance/:id', async (req, res) => {
  try {
    const performance = await Performance.findByIdAndDelete(req.params.id);
    if (!performance) return res.status(404).json({ success: false, message: 'Performance record not found' });
    res.status(200).json({ success: true, message: 'Performance data deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting performance data', error: err.message });
  }
});

module.exports = router;