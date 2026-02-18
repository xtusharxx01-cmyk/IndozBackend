require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const liveRoutes = require('./routes/liveRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const hireStudioRequestRoutes = require('./routes/hireStudioRequestRoutes');
const adsQuoteInquiryRoutes = require('./routes/adsQuoteInquiryRoutes');
const adRoutes = require('./routes/adRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:19006',
  'http://ec2-15-134-208-12.ap-southeast-2.compute.amazonaws.com:4000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors()); // handle preflight

/* ========================= */

app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/users', userRoutes);
app.use('/ads', adRoutes);
app.use('/api', hireStudioRequestRoutes);
app.use('/api', adsQuoteInquiryRoutes);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync();
    console.log('Database synced successfully.');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Database connection error:', error);
  }
})();
