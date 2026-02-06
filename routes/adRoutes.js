const express = require('express');
const Ad = require('../models/Ad');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

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

// Helper function to upload to S3
async function uploadToS3(file) {
  const fileName = `${uuidv4()}${path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '')}`; // Sanitize file name
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  console.log('S3 Upload Params:', JSON.stringify(params, null, 2)); // Debug log to inspect parameters

  if (!file.buffer) {
    console.error('File buffer is empty'); // Log empty file buffer error
    throw new Error('File buffer is empty'); // Handle empty file buffer
  }

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const result = await s3.send(new PutObjectCommand(params));
      console.log('S3 Upload Success:', result); // Log successful upload response
      return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      attempts++;
      console.error(`S3 Upload Attempt ${attempts} Failed:`, error); // Log detailed error response
      if (attempts >= maxAttempts) {
        throw new Error(`S3 upload failed after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
}

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
router.post('/', (req, res, next) => {
  upload.single('ad_image')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Unexpected field name. Expected field name: ad_image' });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { redirect_url, is_active } = req.body;
  if (!redirect_url) return res.status(400).json({ success: false, message: 'redirect_url is required' });

  try {
    let adImageUrl = null;

    // If a file is uploaded, upload to S3
    if (req.file) {
      try {
        adImageUrl = await uploadToS3(req.file);
      } catch (s3err) {
        console.error('S3 upload failed:', s3err);
        return res.status(500).json({ success: false, message: 'S3 upload failed', error: s3err.message });
      }
    }

    const ad = await Ad.create({
      ad_image: adImageUrl,
      redirect_url,
      is_active: is_active || true,
    });

    res.status(201).json({ success: true, ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update an ad by ID
router.put('/:id', upload.single('ad_image'), async (req, res) => {
  const { id } = req.params;
  const { redirect_url, is_active, type } = req.body;

  try {
    const ad = await Ad.findByPk(id);
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    let adImageUrl = ad.ad_image;

    // If a new image file is uploaded, upload to S3
    if (req.file) {
      try {
        adImageUrl = await uploadToS3(req.file);
      } catch (s3err) {
        console.error('S3 upload failed:', s3err);
        return res.status(500).json({ success: false, message: 'S3 upload failed', error: s3err.message });
      }
    }

    await ad.update({
      ad_image: adImageUrl,
      redirect_url,
      is_active: is_active || ad.is_active,
      type: type || ad.type,
    });

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