const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'absent'
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isWithinZone: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
