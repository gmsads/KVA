const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const sendWhatsAppMessage = require("../utils/sendWhatsApp");

// Euclidean distance calculation function
const euclideanDistance = (a, b) => {
  if (!a || !b || a.length !== b.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
};

router.post('/recognize', async (req, res) => {
  try {
    const { descriptor, studentName } = req.body;
    
    if (!descriptor) {
      return res.status(400).json({ 
        success: false,
        message: 'No face descriptor provided' 
      });
    }

    if (!studentName) {
      return res.status(400).json({ 
        success: false,
        message: 'Student name is required' 
      });
    }

    // Find the specific student by name
    const student = await Student.findOne({
      $or: [
        { firstName: { $regex: new RegExp(studentName, 'i') } },
        { lastName: { $regex: new RegExp(studentName, 'i') } },
        { 
          $expr: { 
            $regexMatch: { 
              input: { $concat: ["$firstName", " ", "$lastName"] }, 
              regex: new RegExp(studentName, 'i') 
            } 
          } 
        }
      ]
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }

    if (!student.faceDescriptor || student.faceDescriptor.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No face data registered for this student' 
      });
    }

    // Calculate distance between captured face and stored face
    const distance = euclideanDistance(descriptor, student.faceDescriptor);
    
    // If distance is below threshold, it's a match
    if (distance < 0.6) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Mark attendance for this student
      await Attendance.findOneAndUpdate(
        { 
          studentId: student._id, 
          date: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
          }
        },
        { 
          $set: { 
            status: 'present',
            loginTime: new Date(),
            studentName: `${student.firstName} ${student.lastName}`,
            admissionNo: student.admissionNo,
            class: student.class
          } 
        },
        { upsert: true, new: true }
      );
      
      return res.json({ 
        success: true,
        studentId: student._id, 
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        class: student.class
      });
    } else {
      return res.json({ 
        success: false,
        message: 'Face does not match the registered student' 
      });
    }

  } catch (err) {
    console.error('Attendance recognition error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
});

// Get attendance records with proper filtering - FIXED VERSION
router.get('/', async (req, res) => {
  try {
    const { date, year, month, class: classFilter, page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    // Date filter (specific date) - highest priority
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    } 
    // Year and month filters (when no specific date is provided)
    else if ((year && year !== 'all') || (month && month !== 'all')) {
      let startDate, endDate;
      
      // If year is provided
      if (year && year !== 'all') {
        startDate = new Date(parseInt(year), 0, 1);
        endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
      } else {
        // Default to current year if no year specified
        const currentYear = new Date().getFullYear();
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      }
      
      // If month is provided, adjust the date range
      if (month && month !== 'all') {
        const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
        startDate.setMonth(monthNum);
        endDate = new Date(startDate.getFullYear(), monthNum + 1, 0, 23, 59, 59, 999);
      }
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    // Class filter - only apply if not "all"
    if (classFilter && classFilter !== 'all') {
      query.class = classFilter;
    }
    
    const attendance = await Attendance.find(query)
      .sort({ loginTime: -1 }) // Sort by loginTime descending (newest first)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Attendance.countDocuments(query);
    
    res.json({
      success: true,
      data: attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
});

// Mark attendance endpoint
router.post('/mark', async (req, res) => {
  try {
    const { studentName, image, timestamp } = req.body;

    if (!studentName) {
      return res.status(400).json({ success: false, message: 'Student name is required' });
    }

    // 🔍 Find student by firstName, lastName or fullName
    const student = await Student.findOne({
      $or: [
        { firstName: { $regex: new RegExp(studentName, 'i') } },
        { lastName: { $regex: new RegExp(studentName, 'i') } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: new RegExp(studentName, 'i')
            }
          }
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // 📅 Handle today's date
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // ✅ Check if student already has attendance for today
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: `${student.firstName} ${student.lastName} has already logged in today at ${existingAttendance.loginTime.toLocaleTimeString()}`
      });
    }

    const loginTime = timestamp ? new Date(timestamp) : new Date();

    // 📌 Save attendance
    const attendanceRecord = new Attendance({
      studentId: student._id,
      status: 'present',
      loginTime: loginTime,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      class: student.class,
      date: startOfDay,
      ...(image && { image })
    });

    await attendanceRecord.save();

    // ✅ Send WhatsApp notification to parent
    if (student.parentPhone) {
      let parentPhone = student.parentPhone.trim();

      // ensure phone number starts with +91
      if (!parentPhone.startsWith('+')) {
        parentPhone = `+91${parentPhone}`;
      }

      const formattedTime = loginTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const message = `Dear Parent, your child ${student.firstName} ${student.lastName} has logged in on ${today.toLocaleDateString()} at ${formattedTime}.`;

      try {
        await sendWhatsAppMessage(parentPhone, message);
        console.log(`✅ WhatsApp sent to parent: ${parentPhone}`);
      } catch (whatsappErr) {
        console.error('❌ WhatsApp sending error:', whatsappErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      data: attendanceRecord
    });

  } catch (err) {
    console.error('Attendance marking error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Additional endpoint to get today's attendance
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendance = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ loginTime: -1 });
    
    res.json({
      success: true,
      data: attendance,
      total: attendance.length
    });
  } catch (err) {
    console.error('Error fetching today\'s attendance:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: err.message 
    });
  }
});

// In your backend route
router.get('/classes', async (req, res) => {
  try {
    // Get unique classes from students collection (not attendance)
    const classes = await Student.distinct('class');
    
    // If no classes found in students, use default classes 1-10
    let uniqueClasses = classes.filter(cls => cls && cls.trim() !== '');
    
    if (uniqueClasses.length === 0) {
      // Create default classes if none exist
      uniqueClasses = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
    }
    
    // Sort classes numerically
    uniqueClasses.sort((a, b) => {
      const numA = parseInt(a.replace('Class ', ''));
      const numB = parseInt(b.replace('Class ', ''));
      return numA - numB;
    });
    
    res.json({
      success: true,
      classes: uniqueClasses
    });
  } catch (err) {
    console.error('Error fetching classes:', err);
    
    // Fallback: return default classes
    const defaultClasses = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);
    
    res.json({
      success: true,
      classes: defaultClasses
    });
  }
});

module.exports = router;