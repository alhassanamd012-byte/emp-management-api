const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// Save push token
router.post('/save-token', async (req, res) => {
  try {
    const { token, employeeId } = req.body;
    await Employee.findByIdAndUpdate(employeeId, { pushToken: token });
    res.json({ success: true, message: 'Push token saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send to specific employee
router.post('/send', async (req, res) => {
  try {
    const { employeeId, title, body } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee || !employee.pushToken) {
      return res.status(404).json({ success: false, message: 'No push token found' });
    }
    const message = {
      to: employee.pushToken,
      sound: 'default',
      title: title,
      body: body,
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
        message: 'Push failed: ' + expoResult.data.message
      });
    }
    res.json({ success: true, message: 'Notification sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send to all employees
router.post('/send-all', async (req, res) => {
  try {
    const { title, body } = req.body;
    const employees = await Employee.find({ pushToken: { $ne: null } });
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'No employees with push tokens' });
    }
    const messages = employees.map(emp => ({
      to: emp.pushToken,
      sound: 'default',
      title: title,
      body: body,
    }));
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
    res.json({ success: true, message: 'Notifications sent!', result: expoResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
