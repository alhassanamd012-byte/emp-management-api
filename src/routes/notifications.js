const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// Save employee push token
router.post('/save-token', async (req, res) => {
  try {
    const { employeeId, pushToken } = req.body;
    await Employee.findByIdAndUpdate(employeeId, { pushToken });
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
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const expoResult = await expoResponse.json();
    console.log('Expo push result:', JSON.stringify(expoResult));
    if (expoResult.data?.status === 'error') {
      return res.status(400).json({
        success: false,
        message: 'Expo push failed: ' + expoResult.data.message
      });
    }
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
    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const expoResult = await expoResponse.json();
    console.log('Expo push result (all):', JSON.stringify(expoResult));
    if (Array.isArray(expoResult.data)) {
      const errors = expoResult.data.filter(r => r.status === 'error');
      if (errors.length > 0) {
        console.log('Push errors:', JSON.stringify(errors));
      }
    }
    res.json({ success: true, message: `Notification sent to ${messages.length} employees!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
