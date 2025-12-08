const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Article = sequelize.define('Article', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  desc: { type: DataTypes.TEXT, allowNull: false },
  thumbnail: { type: DataTypes.STRING, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  is_trending: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Article;
