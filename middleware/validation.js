const { body, validationResult } = require('express-validator');

const validateUser = [
  body('firstName').not().isEmpty().withMessage('First name is required'),
  body('lastName').not().isEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').not().isEmpty().withMessage('Password is required'),
  body('phone').not().isEmpty().withMessage('Phone number is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

const validateOrganisation = [
  body('name').not().isEmpty().withMessage('Organisation name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateUser,
  validateOrganisation
};
