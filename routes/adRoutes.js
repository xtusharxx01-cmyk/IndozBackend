const express = require('express');
const Ad = require('../models/Ad');
const router = express.Router();

// Get all ads
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.findAll();
    res.json({ success: true, ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get a single ad by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ad = await Ad.findByPk(id);
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new ad
router.post('/', async (req, res) => {
  const { ad_image, redirect_url, is_active, type } = req.body;
  if (!ad_image || !redirect_url || !type) return res.status(400).json({ success: false, message: 'ad_image, redirect_url, and type are required' });
  try {
    const ad = await Ad.create({ ad_image, redirect_url, is_active, type });
    res.status(201).json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update an ad by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ad = await Ad.findByPk(id);
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    await ad.update({ ...req.body, type: req.body.type });
    res.json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete an ad by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ad = await Ad.findByPk(id);
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    await ad.destroy();
    res.json({ success: true, message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;