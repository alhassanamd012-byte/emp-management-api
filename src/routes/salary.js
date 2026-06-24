const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Attendance = require('../models/Attendance');

// Generate salary for employee
router.post('/generate', async (req, res) => {
  try {
    const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;
    // Count present days
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const presentDays = await Attendance.countDocuments({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: 'present'
    });
    const totalDays = endDate.getDate();
    const absentDays = totalDays - presentDays;
    const perDaySalary = basicSalary / totalDays;
    const deductionForAbsent = perDaySalary * absentDays;
    const netSalary = basicSalary + allowances - deductions - deductionForAbsent;
    const salary = new Salary({
      employee: employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      totalDaysWorked: presentDays,
      totalDaysAbsent: absentDays,
      netSalary: Math.round(netSalary)
    });
    await salary.save();
    res.json({ success: true, message: 'Salary generated!', salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark salary as paid
router.put('/:id/pay', async (req, res) => {
  try {
    const salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidOn: new Date() },
      { new: true }
    );
    res.json({ success: true, message: 'Salary marked as paid!', salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get salary by employee
router.get('/:employeeId', async (req, res) => {
  try {
    const salaries = await Salary.find({ employee: req.params.employeeId }).sort({ year: -1, month: -1 });
    res.json({ success: true, salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all salaries (Admin)
router.get('/', async (req, res) => {
  try {
    const salaries = await Salary.find().populate('employee', 'name employeeId department').sort({ year: -1, month: -1 });
    res.json({ success: true, salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
