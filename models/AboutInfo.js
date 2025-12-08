const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AboutInfo = sequelize.define('AboutInfo', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  org_name: { type: DataTypes.STRING, allowNull: false },
  desc: { type: DataTypes.TEXT, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false }
});

module.exports = AboutInfo;
