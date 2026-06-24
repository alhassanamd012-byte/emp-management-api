const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token, role: 'admin' });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Employee Login
router.post('/employee/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: employee._id, role: 'employee' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, role: 'employee', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
