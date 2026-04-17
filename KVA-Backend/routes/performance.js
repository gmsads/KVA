// routes/performance.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Performances = require('../models/Performances');

// ✅ Subjects endpoint
router.get('/subjects', async (req, res) => {
  try {
    const subjects = [
      { _id: '1', name: 'Mathematics' },
      { _id: '2', name: 'Science' },
      { _id: '3', name: 'English' },
      { _id: '4', name: 'Social Studies' },
      { _id: '5', name: 'Hindi' }
    ];

    res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Error fetching subjects', error: error.message });
  }
});

// ✅ Batch save performances - FIXED: Now properly checks for month when saving weekly data
router.post('/batch', async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Records array is required' });
    }

    console.log('Received records:', JSON.stringify(records, null, 2));

    const results = [];

    for (const record of records) {
      const { studentId, testType, date, month, week, year, subjects } = record;

      try {
        const student = await Student.findById(studentId);
        if (!student) {
          results.push({ studentId, success: false, error: 'Student not found' });
          continue;
        }

        console.log(`Processing record for student ${student.firstName} ${student.lastName}:`, {
          testType, date, month, week, year
        });

        // FIXED: Check if record already exists with proper month consideration
        let existing;
        
        if (testType === 'weekly') {
          // For weekly records, check for same student, testType, year, week, AND month
          existing = await Performances.findOne({
            studentId,
            testType,
            year,
            week,
            month // Added month to the query for weekly records
          });
        } else {
          // For monthly records, check for same student, testType, year, and month
          existing = await Performances.findOne({
            studentId,
            testType,
            year,
            month
          });
        }

        if (existing) {
          // Update existing record
          existing.subjects = subjects;
          existing.date = date || existing.date;
          existing.month = month || existing.month;
          existing.week = week || existing.week;
          await existing.save();
          results.push({ studentId, success: true, updated: true });
          console.log(`Updated existing record for student ${student.firstName}`);
        } else {
          // Create new record
          const newRecord = await Performances.create({ studentId, testType, date, month, week, year, subjects });
          results.push({ studentId, success: true, created: true });
          console.log(`Created new record for student ${student.firstName}:`, newRecord);
        }

      } catch (err) {
        console.error(`Error saving performance for student ${studentId}:`, err);
        results.push({ studentId, success: false, error: err.message });
      }
    }

    res.status(201).json({ success: true, message: 'Batch processed', data: results });
  } catch (error) {
    console.error('Batch error:', error);
    res.status(500).json({ success: false, message: 'Error saving performances', error: error.message });
  }
});

// ✅ Get performance with filters - FIXED: Proper filtering for weekly data with month consideration
router.get('/', async (req, res) => {
  try {
    const { gradeLevel, class: className, studentId, testType, week, month, year } = req.query;
    
    // First get students based on filters
    let studentFilter = {};
    if (gradeLevel) studentFilter.level = gradeLevel;
    if (className) studentFilter.class = className;
    if (studentId) studentFilter._id = studentId;
    
    const students = await Student.find(studentFilter).select('_id firstName lastName admissionNo class level');
    const studentIds = students.map(s => s._id);
    
    if (studentIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    
    // Build performance filter
    let performanceFilter = { studentId: { $in: studentIds } };
    
    // Handle test type filtering
    if (testType) performanceFilter.testType = testType;
    
    // FIXED: Handle week filtering with month consideration
    if (week && week !== '') {
      performanceFilter.week = week;
      
      // If month is also provided, include it in the filter for weekly records
      if (month && month !== '') {
        performanceFilter.month = month;
      }
    }
    
    // Handle month filtering
    if (month && month !== '') {
      performanceFilter.month = month;
    }
    
    // Handle year filtering
    if (year) performanceFilter.year = parseInt(year);
    
    console.log('Performance filter:', performanceFilter);
    
    const records = await Performances.find(performanceFilter)
      .populate('studentId', 'firstName lastName admissionNo class level');
    
    console.log('Found records:', records.length);
    
    // Group by period for the frontend
    const groupedRecords = {};
    
    records.forEach(record => {
      let key;
      if (record.testType === 'weekly') {
        // FIXED: Include month in the key for weekly records to distinguish between months
        key = `weekly-${record.month}-${record.week}-${record.year}`;
      } else {
        key = `monthly-${record.month}-${record.year}`;
      }
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          _id: record._id,
          testType: record.testType,
          date: record.date,
          week: record.week,
          month: record.month,
          year: record.year,
          students: []
        };
      }
      
      // Add student data to the group
      groupedRecords[key].students.push({
        studentId: record.studentId._id,
        firstName: record.studentId.firstName,
        lastName: record.studentId.lastName,
        admissionNo: record.studentId.admissionNo,
        class: record.studentId.class,
        level: record.studentId.level,
        subjects: record.subjects
      });
    });
    
    // Convert to array and sort by date (most recent first)
    const resultArray = Object.values(groupedRecords).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    res.status(200).json({ success: true, data: resultArray });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ success: false, message: 'Error fetching performance data', error: error.message });
  }
});

// ✅ Update performance record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { testType, date, month, week, year, students } = req.body;
    
    // Find the performance record
    const performance = await Performances.findById(id);
    if (!performance) {
      return res.status(404).json({ success: false, message: 'Performance record not found' });
    }
    
    // Update the record
    if (testType) performance.testType = testType;
    if (date) performance.date = date;
    if (month) performance.month = month;
    if (week) performance.week = week;
    if (year) performance.year = year;
    
    // Update subjects if provided (assuming single student per record in this case)
    if (students && students.length > 0 && students[0].subjects) {
      performance.subjects = students[0].subjects;
    }
    
    await performance.save();
    
    // Populate student data for response
    await performance.populate('studentId', 'firstName lastName admissionNo class level');
    
    res.status(200).json({ 
      success: true, 
      message: 'Performance record updated successfully',
      data: performance
    });
  } catch (error) {
    console.error('Error updating performance record:', error);
    res.status(500).json({ success: false, message: 'Error updating performance record', error: error.message });
  }
});

// ✅ Delete performance record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const performance = await Performances.findByIdAndDelete(id);
    if (!performance) {
      return res.status(404).json({ success: false, message: 'Performance record not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Performance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting performance record:', error);
    res.status(500).json({ success: false, message: 'Error deleting performance record', error: error.message });
  }
});

// ✅ Get performance for a specific student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { testType, month, week, year } = req.query;

    let filter = { studentId };
    if (testType) filter.testType = testType;
    if (month) filter.month = month;
    if (week) filter.week = week;
    if (year) filter.year = year;

    const records = await Performances.find(filter).populate('studentId', 'firstName lastName admissionNo class level');

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({ success: false, message: 'Error fetching student performance', error: error.message });
  }
});

// ✅ Get performance by class
router.get('/class/:className', async (req, res) => {
  try {
    const { className } = req.params;
    const { testType, month, week, year } = req.query;

    // First get students in that class
    const students = await Student.find({ class: className, status: 'active' }).select('_id firstName lastName admissionNo class level');
    const studentIds = students.map(s => s._id);

    let filter = { studentId: { $in: studentIds } };
    if (testType) filter.testType = testType;
    if (month) filter.month = month;
    if (week) filter.week = week;
    if (year) filter.year = year;

    const records = await Performances.find(filter).populate('studentId', 'firstName lastName admissionNo class level');

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching class performance:', error);
    res.status(500).json({ success: false, message: 'Error fetching class performance', error: error.message });
  }
});

// ✅ Debug endpoint
router.get('/debug', async (req, res) => {
  try {
    const all = await Performances.find().populate('studentId', 'firstName lastName class level admissionNo');
    res.status(200).json({ success: true, count: all.length, data: all });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Debug error', error: error.message });
  }
});

module.exports = router;