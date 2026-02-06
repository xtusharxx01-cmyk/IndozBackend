const express = require('express');
const router = express.Router();
const HireStudioRequest = require('../models/HireStudioRequest');
const User = require('../models/User');

// POST /api/hire-studio-request
router.post('/hire-studio-request', async (req, res) => {
  const { userId, email, phoneNumber, query } = req.body || {};
  if (!userId || !email || !phoneNumber || !query) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (typeof phoneNumber !== 'string' || !phoneNumber.startsWith('+')) {
    return res.status(400).json({ success: false, message: 'Phone number must include country code and start with +' });
  }
  try {
    const request = await HireStudioRequest.create({ userId, email, phoneNumber, query });
    return res.status(201).json({ success: true, request });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/hire-studio-requests
router.get('/hire-studio-requests', async (req, res) => {
  try {
    const requests = await HireStudioRequest.findAll();
    const userIds = requests.map(request => request.userId);
    const users = await User.findAll({ where: { id: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});

    const enrichedRequests = requests.map(request => ({
      ...request.toJSON(),
      user: userMap[request.userId] || null
    }));

    return res.status(200).json({ success: true, requests: enrichedRequests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
