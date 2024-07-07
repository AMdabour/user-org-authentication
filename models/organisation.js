const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organisation = sequelize.define('Organisation', {
  orgId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  }
});

module.exports = Organisation;
