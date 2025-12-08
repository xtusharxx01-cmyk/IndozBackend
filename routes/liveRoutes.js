const express = require('express');
const LiveStream = require('../models/LiveStream');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const live = await LiveStream.findOne({ where: { is_active: true } });
    if (!live) return res.status(404).json({ success: false, message: 'No active live stream' });
    return res.json({ success: true, live });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Public create
router.post('/', async (req, res) => {
  const { stream_url, is_active } = req.body || {};
  if (!stream_url) return res.status(400).json({ success: false, message: 'stream_url is required' });
  try {
    if (is_active) await LiveStream.update({ is_active: false }, { where: {} });
    const live = await LiveStream.create({ stream_url, is_active: !!is_active });
    return res.status(201).json({ success: true, live });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Public update
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const live = await LiveStream.findByPk(id);
    if (!live) return res.status(404).json({ success: false, message: 'Live stream not found' });
    if (req.body.is_active) await LiveStream.update({ is_active: false }, { where: {} });
    await live.update(req.body);
    return res.json({ success: true, live });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Public delete
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const live = await LiveStream.findByPk(id);
    if (!live) return res.status(404).json({ success: false, message: 'Live stream not found' });
    await live.destroy();
    return res.json({ success: true, message: 'Live stream deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
