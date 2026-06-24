const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    res.json({ success: true, employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new employee
router.post('/', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const employee = new Employee({ ...rest, password: hashedPassword });
    await employee.save();
    res.json({ success: true, message: 'Employee added successfully', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, message: 'Employee updated successfully', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
