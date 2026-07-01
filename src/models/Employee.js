const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  joiningDate: { type: Date, required: true },

  // Salary Info
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },

  // Documents
  aadharNumber: { type: String },
  panNumber: { type: String },
  address: { type: String },

  // Status
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'employee' },
  pushToken: { type: String, default: null },

  // Live Location Status
  lastLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  lastLocationTime: { type: Date, default: null },
  isInsideZone: { type: Boolean, default: true },
  outsideSince: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
