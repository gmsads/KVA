const express = require('express');
const router = express.Router();
const Scholar = require('../models/Scholar');

// GET all scholars with their performance data
router.get('/', async (req, res) => {
  try {
    const scholars = await Scholar.find().sort({ name: 1 });
    res.json(scholars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a specific scholar by ID with performance data
router.get('/:id', getScholar, (req, res) => {
  res.json(res.scholar);
});

// CREATE a new scholar with performance data
router.post('/', async (req, res) => {
  try {
    const scholarData = req.body;
    
    // Create default subjects if not provided
    if (!scholarData.subjects || scholarData.subjects.length === 0) {
      scholarData.subjects = [
        { name: 'Mathematics', score: 0, lastTest: 0, grade: 'N/A', performance: 'weak' },
        { name: 'Physics', score: 0, lastTest: 0, grade: 'N/A', performance: 'weak' },
        { name: 'Chemistry', score: 0, lastTest: 0, grade: 'N/A', performance: 'weak' },
        { name: 'English', score: 0, lastTest: 0, grade: 'N/A', performance: 'weak' }
      ];
    }
    
    // Ensure weeklyTests and monthlyTests are arrays
    if (!scholarData.weeklyTests) scholarData.weeklyTests = [];
    if (!scholarData.monthlyTests) scholarData.monthlyTests = [];
    
    const scholar = new Scholar(scholarData);
    
    // Update performance metrics before saving
    scholar.updatePerformanceMetrics();
    
    const newScholar = await scholar.save();
    res.status(201).json(newScholar);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a scholar's performance data
router.patch('/:id/performance', getScholar, async (req, res) => {
  try {
    const { subjects, weeklyTests, monthlyTests } = req.body;
    
    if (subjects) {
      res.scholar.subjects = subjects;
    }
    if (weeklyTests) {
      res.scholar.weeklyTests = weeklyTests;
    }
    if (monthlyTests) {
      res.scholar.monthlyTests = monthlyTests;
    }
    
    // Update performance metrics before saving
    res.scholar.updatePerformanceMetrics();
    
    const updatedScholar = await res.scholar.save();
    res.json(updatedScholar);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a scholar's basic info
router.patch('/:id', getScholar, async (req, res) => {
  try {
    Object.keys(req.body).forEach(key => {
      if (key !== 'subjects' && key !== 'weeklyTests' && key !== 'monthlyTests') {
        res.scholar[key] = req.body[key];
      }
    });
    
    const updatedScholar = await res.scholar.save();
    res.json(updatedScholar);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE a scholar - comprehensive update (PUT)
router.put('/:id', getScholar, async (req, res) => {
  try {
    // Update all fields from request body
    Object.keys(req.body).forEach(key => {
      res.scholar[key] = req.body[key];
    });
    
    // Update performance metrics before saving
    res.scholar.updatePerformanceMetrics();
    
    const updatedScholar = await res.scholar.save();
    res.json(updatedScholar);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a scholar
router.delete('/:id', getScholar, async (req, res) => {
  try {
    await Scholar.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scholar deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET scholars by level
router.get('/level/:level', async (req, res) => {
  try {
    const scholars = await Scholar.find({ level: req.params.level }).sort({ name: 1 });
    res.json(scholars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to get scholar by ID
async function getScholar(req, res, next) {
  let scholar;
  try {
    scholar = await Scholar.findById(req.params.id);
    if (scholar == null) {
      return res.status(404).json({ message: 'Scholar not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
  
  res.scholar = scholar;
  next();
}

module.exports = router;