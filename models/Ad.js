const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Ad = sequelize.define('Ad', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ad_image: { type: DataTypes.STRING, allowNull: false },
  redirect_url: { type: DataTypes.STRING, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  type: { type: DataTypes.STRING, allowNull: true } // Updated allowNull to true
});

module.exports = Ad;