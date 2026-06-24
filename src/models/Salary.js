const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  totalDaysWorked: { type: Number, default: 0 },
  totalDaysAbsent: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paidOn: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Salary', salarySchema);
