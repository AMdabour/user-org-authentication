const User = require('./User');
const Organisation = require('./organisation');

// User-Organisation relationship
User.belongsToMany(Organisation, { through: 'UserOrganisations', onDelete: 'CASCADE' });
Organisation.belongsToMany(User, { through: 'UserOrganisations', onDelete: 'CASCADE' });

module.exports = { User, Organisation };
