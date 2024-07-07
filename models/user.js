const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING
    }
  });
  
  User.prototype.generateAccessToken = async function () {
    const payload = {
      userId: this.userId,
    };

    const accessToken = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return accessToken;
  };

  module.exports = User;
  