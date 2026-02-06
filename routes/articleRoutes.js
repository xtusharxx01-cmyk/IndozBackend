const express = require('express');
const Article = require('../models/Article');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  },
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Middleware to log incoming requests for debugging
router.use((req, res, next) => {
  console.log('Incoming Request Headers:', req.headers);
  console.log('Incoming Request Body:', req.body);
  next();
});

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
// Create article (supports multipart/form-data for thumbnail upload)
router.post('/', upload.single('thumbnail'), async (req, res) => {
  try {
    console.log('POST /api/articles called');
    let { title, desc, url, is_trending } = req.body || {};
    let thumbnailUrl = req.body.thumbnail || '';
    console.log('Request body:', req.body);
    if (req.file) {
      console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size);
    }

    if (!title || !desc || !url) {
      console.log('Missing required fields');
      return res.status(400).json({ success: false, message: 'title, desc, and url are required' });
    }

    // If a file is uploaded, upload to S3
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filename = `thumbnails/${Date.now()}-${uuidv4()}${ext}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      try {
        await s3.send(new PutObjectCommand(params));
        thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        console.log('S3 upload success:', thumbnailUrl);
      } catch (s3err) {
        console.error('S3 upload failed:', s3err);
        return res.status(500).json({ success: false, message: 'S3 upload failed', error: s3err.message });
      }
    }

    if (!thumbnailUrl) {
      console.log('No thumbnail provided');
      return res.status(400).json({ success: false, message: 'thumbnail is required (as file or url)' });
    }

    let newId;
    try {
      // Try to let auto-increment handle id
      const article = await Article.create({
        title,
        desc,
        thumbnail: thumbnailUrl,
        url,
        is_trending: !!is_trending,
      });
      console.log('Article created:', article.id);
      return res.status(201).json({ success: true, article });
    } catch (uniqueErr) {
      if (uniqueErr.name === 'SequelizeUniqueConstraintError' && uniqueErr.errors.some(e => e.path === 'id')) {
        // Fallback: get max id and increment
        const maxId = await Article.max('id') || 0;
        newId = maxId + 1;
        const article = await Article.create({
          id: newId,
          title,
          desc,
          thumbnail: thumbnailUrl,
          url,
          is_trending: !!is_trending,
        });
        console.log('Article created with fallback id:', article.id);
        return res.status(201).json({ success: true, article });
      } else {
        console.error('Article creation error:', uniqueErr);
        return res.status(500).json({ success: false, message: uniqueErr.message });
      }
    }
  } catch (err) {
    console.error('POST /api/articles error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Update article
router.put('/:id', upload.single('thumbnail'), async (req, res) => {
  const { id } = req.params;
  try {
    const article = await Article.findByPk(id);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

    console.log('Edit request received for article ID:', id);
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    let updateData = { ...req.body };
    // If a new thumbnail file is uploaded, upload to S3
    if (req.file) {
      const ext = path.extname(req.file.originalname);
      const filename = `thumbnails/${Date.now()}-${uuidv4()}${ext}`;
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
      try {
        await s3.send(new PutObjectCommand(params));
        updateData.thumbnail = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        console.log('S3 upload success (edit):', updateData.thumbnail);
      } catch (s3err) {
        console.error('S3 upload failed (edit):', s3err);
        return res.status(500).json({ success: false, message: 'S3 upload failed', error: s3err.message });
      }
    }
    await article.update(updateData);
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
