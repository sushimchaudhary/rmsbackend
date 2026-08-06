const jwt = require('jsonwebtoken');

// Mirrors SIMPLE_JWT: separate access/refresh tokens with independent
// secrets and lifetimes, HS256 signing.
const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

module.exports = { generateAccessToken, generateRefreshToken };
