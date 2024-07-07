const sequelize = require('./database');
const { User, Organization } = require('../models/index');

async function syncModels() {
  try {
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('An error occurred while synchronizing models:', error);
  }
}

module.exports = syncModels;
