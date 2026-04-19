module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'banking_secret_key_changez_moi_en_prod',
  JWT_EXPIRES_IN: '8h',
  PORT: process.env.PORT || 3000
};