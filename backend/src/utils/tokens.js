const crypto = require('crypto');

const generateEmailToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateTokenExpiry = (hours = 24) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = {
  generateEmailToken,
  generateTokenExpiry
};