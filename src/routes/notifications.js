const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n')
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

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

// Send notification to employee via FCM V1
router.post('/send', async (req, res) => {
  try {
    const { employeeId, title, body } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee?.pushToken) {
      return res.status(404).json({ success: false, message: 'No push token found' });
    }
    const message = {
      token: employee.pushToken,
      notification: { title, body },
      android: { notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default' } } },
    };
    const response = await admin.messaging().send(message);
    console.log('FCM send response:', response);
    res.json({ success: true, message: 'Notification sent!', messageId: response });
  } catch (error) {
    console.error('FCM send error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send notification to all employees via FCM V1
router.post('/send-all', async (req, res) => {
  try {
    const { title, body } = req.body;
    const employees = await Employee.find({ pushToken: { $exists: true, $ne: null } });
    if (employees.length === 0) {
      return res.json({ success: false, message: 'No employees with push tokens' });
    }
    const messages = employees.map(emp => ({
      token: emp.pushToken,
      notification: { title, body },
      android: { notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default' } } },
    }));
    const result = await admin.messaging().sendEach(messages);
    console.log(`FCM result: ${result.successCount} sent, ${result.failureCount} failed`);
    const errors = result.responses
      .map((r, i) => r.error ? { index: i, error: r.error.message } : null)
      .filter(Boolean);
    if (errors.length > 0) console.log('FCM errors:', JSON.stringify(errors));
    res.json({
      success: true,
      message: `Notification sent to ${result.successCount} of ${employees.length} employees!`,
    });
  } catch (error) {
    console.error('FCM send-all error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
