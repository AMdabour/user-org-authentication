require('dotenv').config()
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  
  const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'No token provided',
        statusCode: 401
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'No token provided',
        statusCode: 401
      });
    }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ where: { userId: decoded.userId } });

    if (!user) {
      return res.status(401).json({
        status: 'Unauthorized',
        message: 'Invalid token',
        statusCode: 401
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'Unauthorized',
      message: 'Invalid token',
      statusCode: 401
    });
  }
};

module.exports = authenticateToken;
