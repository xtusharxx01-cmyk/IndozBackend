const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdsQuoteInquiry = sequelize.define('AdsQuoteInquiry', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = AdsQuoteInquiry;
