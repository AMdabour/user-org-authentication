require('dotenv').config()
const bcrypt = require('bcryptjs');
const {User, Organisation} = require('../models');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET
  exports.register = async (req, res) => {
    const { firstName, lastName, email, password, phone } = req.body;
  
    try {
      // Check if a user with the same email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          status: 'Bad request',
          message: 'Email is already in use',
          statusCode: 400
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        userId: uuidv4(),
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone
        });

      const organisation = await Organisation.create({
        orgId: uuidv4(),
        name: `${firstName}'s Organisation`,
        description: ''
        });
      
      await user.addOrganisation(organisation);

      const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
  
      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: {
          accessToken: token,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone
          }
        }
      });
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.error('Validation errors:', error.errors);
        const validationErrors = error.errors.map(err => ({
            field: err.path,
            message: err.message
        }));
        return res.status(400).json({
            status: 'Bad request',
            message: 'Validation errors occurred',
            statusCode: 400,
            errors: validationErrors
        });
    }
    
    console.error('Registration error:', error);
    res.status(400).json({
        status: 'Bad request',
        message: 'Registration unsuccessful',
        statusCode: 400,
        error: error.message
    });
}
  };

  exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ where: { email } });
  
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({
          status: 'Bad request',
          message: 'Authentication failed',
          statusCode: 401
        });
      }
  
      const token = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });
  
      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          accessToken: token,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone
          }
        }
      });
    } catch (error) {
      res.status(401).json({
        status: 'Bad request',
        message: 'Authentication failed',
        statusCode: 401,
        error: error.message
      });
    }
  };

  exports.getUserById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findOne({ where: { userId: id } });
  
      if (!user) {
        return res.status(404).json({
          status: 'Not found',
          message: 'User not found',
          statusCode: 404
        });
      }
  
      res.status(200).json({
        status: 'success',
        message: 'User retrieved successfully',
        data: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        statusCode: 500
      });
    }
  };

  exports.getAllOrganisations = async (req, res) => {
    try {
      const organisations = await Organisation.findAll({
        include: {
          model: User,
          where: { userId: req.user.userId }
        }
      });
  
      res.status(200).json({
        status: 'success',
        message: 'Organisations retrieved successfully',
        data: {
          organisations: organisations.map(org => ({
            orgId: org.orgId,
            name: org.name,
            description: org.description
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching organisations:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        statusCode: 500
      });
    }
  };

  exports.getOrganisationById = async (req, res) => {
    const { orgId } = req.params;
  
    try {
      const organisation = await Organisation.findOne({
        where: { orgId },
        include: {
          model: User,
          where: { userId: req.user.userId }
        }
      });
  
      if (!organisation) {
        return res.status(404).json({
          status: 'Not found',
          message: 'Organisation not found',
          statusCode: 404
        });
      }
  
      res.status(200).json({
        status: 'success',
        message: 'Organisation retrieved successfully',
        data: {
          orgId: organisation.orgId,
          name: organisation.name,
          description: organisation.description
        }
      });
    } catch (error) {
      console.error('Error fetching organisation:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        statusCode: 500
      });
    }
  };

  exports.AddUserToOrganisation = async (req, res) => {
    const { orgId } = req.params;
    const { userId } = req.body;
  
    try {
      // Find the organisation by orgId
      const organisation = await Organisation.findOne({ where: { orgId } });
  
      if (!organisation) {
        return res.status(404).json({
          status: 'Not found',
          message: 'Organisation not found',
          statusCode: 404
        });
      }
  
      // Find the user by userId
      const user = await User.findOne({ where: { userId } });
  
      if (!user) {
        return res.status(404).json({
          status: 'Not found',
          message: 'User not found',
          statusCode: 404
        });
      }
  
      // Add the user to the organisation
      await organisation.addUser(user);
  
      res.status(200).json({
        status: 'success',
        message: 'User added to organisation successfully'
      });
    } catch (error) {
      console.error('Error adding user to organisation:', error);
      res.status(400).json({
        status: 'Bad request',
        message: 'Client error',
        statusCode: 400
      });
    }
  };

  exports.createOrganisation = async (req, res) => {
    const { name, description } = req.body;
  
    try {
      // Create the organisation in the database
      const organisation = await Organisation.create({
        orgId: uuidv4(),
        name,
        description
      });

      const user = await User.findOne({where: {userId: req.user.userId}})
      await organisation.addUser(user)
  
      res.status(201).json({
        status: 'success',
        message: 'Organisation created successfully',
        data: {
          orgId: organisation.orgId,
          name: organisation.name,
          description: organisation.description
        }
      });
    } catch (error) {
      console.error('Error creating organisation:', error);
      res.status(400).json({
        status: 'Bad Request',
        message: 'Client error',
        statusCode: 400
      });
    }
  };