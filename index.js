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
// Configure CORS to allow only specified origins (comma-separated in ALLOWED_ORIGINS)
const allowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://localhost:19006']; // common frontend/dev origins

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowed.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  }
}));

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
    console.log('Connection has been established successfully.');

    await sequelize.sync();
    console.log('Database synced successfully');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
