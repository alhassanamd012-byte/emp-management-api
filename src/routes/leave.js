const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
// Employee submit leave request
router.post('/', async (req, res) => {
  try {
    const { employeeId, leaveDate, reason } = req.body;
    const leave = new Leave({
      employee: employeeId,
      leaveDate: new Date(leaveDate),
      reason
    });
    await leave.save();
    res.json({ success: true, message: 'Leave request submitted successfully!', leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get all leave requests (Admin)
router.get('/', async (req, res) => {
  try {
    const leaves = await Leave.find().populate('employee', 'name employeeId department').sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Get leave requests by employee
router.get('/:employeeId', async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.params.employeeId }).sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Approve or reject leave (Admin)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, message: `Leave ${status}!`, leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
