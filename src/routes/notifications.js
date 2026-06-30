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
  const reqId = Date.now();
  console.log('[SEND] Request received reqId=' + reqId + ' employeeId=' + req.body.employeeId);
  try {
    const { employeeId, title, body } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee?.pushToken) {
      return res.status(404).json({ success: false, message: 'No push token found' });
    }
    console.log('[SEND] Pushing to token=' + employee.pushToken.slice(0, 20) + '...');
    const message = {
      to: employee.pushToken,
      sound: 'default',
      title,
      body,
      data: { employeeId },
    };
    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const expoData = await expoRes.json();
    console.log('[SEND] Expo result reqId=' + reqId + ':', JSON.stringify(expoData).slice(0, 200));
    try {
      await NotificationLog.create({ title, body, sentTo: employee.name, sentBy: 'Admin', recipientCount: 1 });
    } catch (logErr) {
      console.log('[SEND] Log error:', logErr.message);
    }
    res.json({ success: true, message: 'Notification sent!' });
  } catch (error) {
    console.log('[SEND] Error reqId=' + reqId + ':', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send notification to all employees
router.post('/send-all', async (req, res) => {
  const reqId = Date.now();
  console.log('[SEND-ALL] Request received reqId=' + reqId);
  try {
    const { title, body } = req.body;
    const employees = await Employee.find({ pushToken: { $exists: true, $ne: null } });
    const messages = employees.map(emp => ({
      to: emp.pushToken,
      sound: 'default',
      title,
      body,
    }));
    const uniqueTokens = new Set(employees.map(e => e.pushToken)).size;
    console.log('[SEND-ALL] employees=' + employees.length + ' uniqueTokens=' + uniqueTokens + ' reqId=' + reqId);
    if (employees.length !== uniqueTokens) {
      console.log('[SEND-ALL] WARNING: duplicate push tokens detected! employees=' + employees.length + ' unique=' + uniqueTokens);
    }
    if (messages.length === 0) {
      return res.json({ success: false, message: 'No employees with push tokens' });
    }
    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const expoData = await expoRes.json();
    console.log('[SEND-ALL] Expo result reqId=' + reqId + ':', JSON.stringify(expoData).slice(0, 300));
    try {
      await NotificationLog.create({ title, body, sentTo: 'All Employees', sentBy: 'Admin', recipientCount: employees.length });
    } catch (logErr) {
      console.log('[SEND-ALL] Log error:', logErr.message);
    }
    res.json({ success: true, message: 'Notification sent to ' + messages.length + ' employees!' });
  } catch (error) {
    console.log('[SEND-ALL] Error reqId=' + reqId + ':', error.message);
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
