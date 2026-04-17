const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// Create a new staff member
router.post('/', async (req, res) => {
  try {
    const staff = new Staff(req.body);
    await staff.save();
    res.status(201).send(staff);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get all staff members
router.get('/', async (req, res) => {
  try {
    const staff = await Staff.find();
    res.send(staff);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get a single staff member
router.get('/:id', async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).send({ error: 'Staff member not found' });
    }
    res.send(staff);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update a staff member
router.patch('/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { 
      new: true,
      runValidators: true
    });
    if (!staff) {
      return res.status(404).send({ error: 'Staff member not found' });
    }
    res.send(staff);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Delete a staff member
router.delete('/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).send({ error: 'Staff member not found' });
    }
    res.send(staff);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;