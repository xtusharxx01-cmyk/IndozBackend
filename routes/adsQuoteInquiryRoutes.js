const express = require('express');
const router = express.Router();
const AdsQuoteInquiry = require('../models/AdsQuoteInquiry');

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

module.exports = router;
