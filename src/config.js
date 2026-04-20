/*module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'banking_secret_key_changez_moi_en_prod',
  JWT_EXPIRES_IN: '8h',
  PORT: process.env.PORT || 3000
};*/

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || (isProd ? 'change_this_in_production' : 'dev_swagger_test_key_12345'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  PORT: process.env.PORT || 3000,
  BASE_URL: process.env.BASE_URL || null
};