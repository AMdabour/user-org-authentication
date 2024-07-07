require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {validateUser, validateOrganisation} = require('./middleware/validation');
const {body, validationResult} = require('express-validator');
const authenticateToken = require('./middleware/auth');
const authController = require('./controllers/authController')
const syncModels = require('./config/sync');

const app = express();
app.use(express.json());
app.use(cors())

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};
// Register endpoint
app.post('/auth/register', validateUser, authController.register);

// Login endpoint
app.post('/auth/login', [
  body('email', 'Email is required').not().isEmpty().bail().isEmail().withMessage('Invalid email'),
  body('password', 'Password is required').not().isEmpty()], handleValidationErrors, authController.login);

// Get user by ID endpoint (protected)
app.get('/api/users/:id', authenticateToken, authController.getUserById);

// Get all organisations (protected)
app.get('/api/organisations', authenticateToken, authController.getAllOrganisations);

// Get a single organisation (protected)
app.get('/api/organisations/:orgId', authenticateToken, authController.getOrganisationById);

// Create a new organisation (protected)
app.post('/api/organisations', validateOrganisation, authenticateToken, authController.createOrganisation);

// Add a user to an organisation (protected)
app.post('/api/organisations/:orgId/users', [
  body('userId').not().isEmpty().withMessage('User ID is required')
], handleValidationErrors, authenticateToken, authController.AddUserToOrganisation);

const PORT = process.env.PORT || 3000;

// Sync models and start the server
syncModels().then(() => {
  app.listen(3000, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to synchronize models:', error);
});

module.exports = app;
