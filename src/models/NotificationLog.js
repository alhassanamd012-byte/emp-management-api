const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  sentTo: { type: String, required: true },
  sentBy: { type: String, default: 'Admin' },
  recipientCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
