const express = require('express');
const router = express.Router();
const AdsQuoteInquiry = require('../models/AdsQuoteInquiry');
const User = require('../models/User');

// POST /api/ads-quote-inquiry
router.post('/ads-quote-inquiry', async (req, res) => {
  const { userId, email, phoneNumber, query } = req.body || {};
  if (!userId || !email || !phoneNumber || !query) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (typeof phoneNumber !== 'string' || !phoneNumber.startsWith('+')) {
    return res.status(400).json({ success: false, message: 'Phone number must include country code and start with +' });
  }
  try {
    const inquiry = await AdsQuoteInquiry.create({ userId, email, phoneNumber, query });
    return res.status(201).json({ success: true, inquiry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/ads-quote-inquiries
router.get('/ads-quote-inquiries', async (req, res) => {
  try {
    const inquiries = await AdsQuoteInquiry.findAll();
    const userIds = inquiries.map(inquiry => inquiry.userId);
    const users = await User.findAll({ where: { id: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.id] = user;
      return map;
    }, {});

    const enrichedInquiries = inquiries.map(inquiry => ({
      ...inquiry.toJSON(),
      user: userMap[inquiry.userId] || null
    }));

    return res.status(200).json({ success: true, inquiries: enrichedInquiries });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
