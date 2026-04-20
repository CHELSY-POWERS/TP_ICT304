module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_swagger_test_key_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h'
};