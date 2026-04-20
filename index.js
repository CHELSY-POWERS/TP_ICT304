/*const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { PORT } = require('./src/config');
const authRoutes = require('./src/authRoutes');
const accountRoutes = require('./src/accountRoutes');

const app = express();

// ───────────────────────────────────────────
// 🔹 GLOBAL MIDDLEWARES
// ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ───────────────────────────────────────────
// 🔹 CORS
// ───────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ───────────────────────────────────────────
// 🔹 SWAGGER
// ───────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banking API',
      version: '1.0.0',
      description: 'API pour système de transaction bancaire',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: ['./src/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ───────────────────────────────────────────
// 🔹 UTILITY ROUTES
// ───────────────────────────────────────────
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur le Système de Transaction Bancaire',
    version: '1.0.0',
    docs: `http://localhost:${PORT}/api-docs`,
    endpoints: {
      health:   'GET  /api/health',
      register: 'POST /api/auth/register',
      login:    'POST /api/auth/login',
      accounts: 'GET  /api/accounts',
      create:   'POST /api/accounts',
      deposit:  'POST /api/accounts/:id/deposit',
      withdraw: 'POST /api/accounts/:id/withdraw',
      history:  'GET  /api/accounts/:id/transactions',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Banking Transaction API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ───────────────────────────────────────────
// 🔹 API ROUTES
// ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

// ───────────────────────────────────────────
// 🔹 404 HANDLER
// ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} introuvable.`,
  });
});

// ───────────────────────────────────────────
// 🔹 GLOBAL ERROR HANDLER
// ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: 'Erreur interne du serveur',
    message: err.message,
  });
});

// ───────────────────────────────────────────
// 🔹 DÉMARRAGE DU SERVEUR
// ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ API démarrée sur http://localhost:${PORT}`);
  console.log(`📄 Swagger docs  : http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health check  : http://localhost:${PORT}/api/health\n`);
});

module.exports = app;*/







const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { PORT, BASE_URL } = require('./src/config');
const authRoutes = require('./src/authRoutes');
const accountRoutes = require('./src/accountRoutes');

const app = express();

// ───────────────────────────────────────────
// 🔹 GLOBAL MIDDLEWARES
// ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ───────────────────────────────────────────
// 🔹 CORS
// ───────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ───────────────────────────────────────────
// 🔹 BASE URL (important pour Swagger en ligne)
// ───────────────────────────────────────────
const baseUrl = BASE_URL || `http://localhost:${PORT}`;

// ───────────────────────────────────────────
// 🔹 SWAGGER
// ───────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Banking API',
      version: '1.0.0',
      description: 'API pour système de transaction bancaire',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: baseUrl }],
  },
  apis: ['./src/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ───────────────────────────────────────────
// 🔹 ROUTES UTILITAIRES
// ───────────────────────────────────────────
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur le Système de Transaction Bancaire',
    version: '1.0.0',
    docs: `${baseUrl}/api-docs`,
    endpoints: {
      health:   'GET  /api/health',
      register: 'POST /api/auth/register',
      login:    'POST /api/auth/login',
      accounts: 'GET  /api/accounts',
      create:   'POST /api/accounts',
      deposit:  'POST /api/accounts/:id/deposit',
      withdraw: 'POST /api/accounts/:id/withdraw',
      history:  'GET  /api/accounts/:id/transactions',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Banking Transaction API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ───────────────────────────────────────────
// 🔹 API ROUTES
// ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

// ───────────────────────────────────────────
// 🔹 404 HANDLER
// ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} introuvable.`,
  });
});

// ───────────────────────────────────────────
// 🔹 GLOBAL ERROR HANDLER
// ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: 'Erreur interne du serveur',
    message: err.message,
  });
});

// ───────────────────────────────────────────
// 🔹 DÉMARRAGE DU SERVEUR
// ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ API démarrée sur ${baseUrl}`);
  console.log(`📄 Swagger docs  : ${baseUrl}/api-docs`);
  console.log(`❤️  Health check  : ${baseUrl}/api/health\n`);
});

module.exports = app;