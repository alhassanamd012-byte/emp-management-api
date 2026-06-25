const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Company location (geo-fence center) - Admin will update this
const COMPANY_LAT = 26.373126;
const COMPANY_LNG = 85.54603;
const ALLOWED_RADIUS_METERS = 150;

// Calculate distance between two coordinates
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Employee Check In
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, latitude, longitude } = req.body;
    const distance = getDistance(latitude, longitude, COMPANY_LAT, COMPANY_LNG);
    const isWithinZone = distance <= ALLOWED_RADIUS_METERS;
    if (!isWithinZone) {
      return res.status(400).json({
        success: false,
        message: 'You are outside the company zone! Attendance cannot be marked.',
        distance: Math.round(distance) + ' meters away'
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ employee: employeeId, date: today });
    if (existing) return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
    const attendance = new Attendance({
      employee: employeeId,
      date: today,
      checkIn: new Date(),
      status: 'present',
      location: { latitude, longitude },
      isWithinZone: true
    });
    await attendance.save();
    res.json({ success: true, message: 'Check-in successful! Attendance recorded.', attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Employee Check Out
router.post('/checkout', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ employee: employeeId, date: today });
    if (!attendance) return res.status(404).json({ success: false, message: 'Aaj ki attendance nahi mili' });
    attendance.checkOut = new Date();
    await attendance.save();
    res.json({ success: true, message: 'Check-out successful!', attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance by employee
router.get('/:employeeId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ employee: req.params.employeeId }).sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all attendance (Admin)
router.get('/', async (req, res) => {
  try {
    const attendance = await Attendance.find().populate('employee', 'name employeeId department').sort({ date: -1 });
    res.json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
