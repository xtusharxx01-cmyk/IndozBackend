const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LiveStream = sequelize.define('LiveStream', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  stream_url: { type: DataTypes.STRING, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = LiveStream;
