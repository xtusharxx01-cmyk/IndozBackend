const express = require('express');
const Article = require('../models/Article');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
  const articles = await Article.findAll({ order: [['createdAt', 'DESC']] });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/trending', async (req, res) => {
  try {
  const trending = await Article.findAll({ where: { is_trending: true }, order: [['createdAt', 'DESC']] });
    res.json(trending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public CRUD endpoints (unprotected)
// Create article
router.post('/', async (req, res) => {
  const { title, desc, thumbnail, url, is_trending } = req.body || {};
  if (!title || !desc || !thumbnail || !url) return res.status(400).json({ success: false, message: 'title, desc, thumbnail and url are required' });
  try {
    const article = await Article.create({ title, desc, thumbnail, url, is_trending: !!is_trending });
    return res.status(201).json({ success: true, article });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update article
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    await article.update(req.body);
    return res.json({ success: true, article });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Delete article
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    await article.destroy();
    return res.json({ success: true, message: 'Article deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
