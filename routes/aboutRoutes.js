const express = require('express');
const AboutInfo = require('../models/AboutInfo');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const about = await AboutInfo.findOne();
    if (!about) return res.status(404).json({ error: 'About info not found' });
    return res.json({ success: true, about });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Public create (single row app)
router.post('/', async (req, res) => {
  const { org_name, desc, email, phone } = req.body || {};
  if (!org_name || !desc || !email || !phone) return res.status(400).json({ success: false, message: 'org_name, desc, email, phone are required' });
  try {
    // keep single row: delete others
    await AboutInfo.destroy({ where: {} });
    const about = await AboutInfo.create({ org_name, desc, email, phone });
    return res.status(201).json({ success: true, about });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Public update
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const about = await AboutInfo.findByPk(id);
    if (!about) return res.status(404).json({ success: false, message: 'About info not found' });
    await about.update(req.body);
    return res.json({ success: true, about });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
