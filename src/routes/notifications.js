const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const NotificationLog = require('../models/NotificationLog');

// Save employee push token
router.post('/save-token', async (req, res) => {
  try {
    const { employeeId, token, pushToken } = req.body;
    const tokenValue = token || pushToken;
    await Employee.findByIdAndUpdate(employeeId, { pushToken: tokenValue });
    res.json({ success: true, message: 'Push token saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send notification to employee
router.post('/send', async (req, res) => {
  try {
    const { employeeId, title, body } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee?.pushToken) {
      return res.status(404).json({ success: false, message: 'No push token found' });
    }
    const message = {
      to: employee.pushToken,
      sound: 'default',
      title,
      body,
      data: { employeeId },
    };
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    await NotificationLog.create({
      title,
      body,
      sentTo: employee.name,
      sentBy: 'Admin',
      recipientCount: 1,
    });
    res.json({ success: true, message: 'Notification sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send notification to all employees
router.post('/send-all', async (req, res) => {
  try {
    const { title, body } = req.body;
    const employees = await Employee.find({ pushToken: { $exists: true, $ne: null } });
    const messages = employees.map(emp => ({
      to: emp.pushToken,
      sound: 'default',
      title,
      body,
    }));
    if (messages.length === 0) {
      return res.json({ success: false, message: 'No employees with push tokens' });
    }
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    await NotificationLog.create({
      title,
      body,
      sentTo: 'All Employees',
      sentBy: 'Admin',
      recipientCount: employees.length,
    });
    res.json({ success: true, message: 'Notification sent to ' + messages.length + ' employees!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get notification history
router.get('/history', async (req, res) => {
  try {
    const { filter } = req.query;
    let dateFilter = {};
    if (filter && filter !== 'all') {
      const now = new Date();
      const filterMap = {
        '2h': new Date(now - 2 * 60 * 60 * 1000),
        '1d': new Date(now - 24 * 60 * 60 * 1000),
        '1w': new Date(now - 7 * 24 * 60 * 60 * 1000),
        '1m': new Date(now - 30 * 24 * 60 * 60 * 1000),
      };
      if (filterMap[filter]) {
        dateFilter = { createdAt: { $gte: filterMap[filter] } };
      }
    }
    const logs = await NotificationLog.find(dateFilter).sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
