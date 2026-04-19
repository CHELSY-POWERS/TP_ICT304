const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('./store');
const { authenticate, authorize } = require('./middleware');

const router = express.Router();

router.use(authenticate);

function generateAccountNumber() {
  const prefix = 'BK';
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${prefix}-${digits}`;
}

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Gestion des comptes bancaires
 */

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Créer un nouveau compte bancaire
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CHECKING, SAVINGS]
 *                 example: CHECKING
 *               initialBalance:
 *                 type: number
 *                 example: 1000
 *               description:
 *                 type: string
 *                 example: Compte principal
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.post('/', (req, res) => {
  try {
    const { type = 'CHECKING', initialBalance = 0, description } = req.body;

    const validTypes = ['CHECKING', 'SAVINGS'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: `Type invalide. Valeurs : ${validTypes.join(', ')}` });
    }

    const balance = parseFloat(initialBalance);
    if (isNaN(balance) || balance < 0) {
      return res.status(400).json({ error: 'Le solde initial doit être positif ou nul.' });
    }

    let accountNumber;
    do {
      accountNumber = generateAccountNumber();
    } while (store.accounts.find(a => a.accountNumber === accountNumber));

    const newAccount = {
      id: uuidv4(),
      accountNumber,
      ownerId: req.user.id,
      ownerName: (() => {
        const u = store.users.find(u => u.id === req.user.id);
        return u ? `${u.firstName} ${u.lastName}` : 'Inconnu';
      })(),
      balance,
      type: type.toUpperCase(),
      status: 'ACTIVE',
      description: description || null,
      createdAt: new Date().toISOString()
    };

    store.accounts.push(newAccount);

    if (balance > 0) {
      store.transactions.push({
        id: uuidv4(),
        accountId: newAccount.id,
        type: 'DEPOSIT',
        amount: balance,
        balanceBefore: 0,
        balanceAfter: balance,
        description: 'Dépôt initial',
        createdAt: newAccount.createdAt
      });
    }

    return res.status(201).json({ message: 'Compte créé avec succès.', account: newAccount });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Lister tous les comptes
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, CLOSED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CHECKING, SAVINGS]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Liste des comptes
 *       401:
 *         description: Non authentifié
 */
router.get('/', (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    let accounts = store.accounts;

    if (req.user.role === 'client') {
      accounts = accounts.filter(a => a.ownerId === req.user.id);
    }

    if (status) accounts = accounts.filter(a => a.status === status.toUpperCase());
    if (type)   accounts = accounts.filter(a => a.type === type.toUpperCase());

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const total    = accounts.length;
    const paginated = accounts.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      data: paginated,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Obtenir un compte par ID
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails du compte
 *       404:
 *         description: Compte introuvable
 */
router.get('/:id', (req, res) => {
  try {
    const account = store.accounts.find(a => a.id === req.params.id);
    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });
    if (req.user.role === 'client' && account.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    return res.status(200).json({ account });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

/**
 * @swagger
 * /api/accounts/{id}/deposit:
 *   post:
 *     summary: Effectuer un dépôt
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *               description:
 *                 type: string
 *                 example: Salaire du mois
 *     responses:
 *       200:
 *         description: Dépôt effectué avec succès
 *       400:
 *         description: Montant invalide
 *       404:
 *         description: Compte introuvable
 */
router.post('/:id/deposit', (req, res) => {
  try {
    const { amount, description } = req.body;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être strictement positif.' });
    }

    const account = store.accounts.find(a => a.id === req.params.id);
    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });
    if (req.user.role === 'client' && account.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (account.status !== 'ACTIVE') {
      return res.status(403).json({ error: `Compte ${account.status}.` });
    }

    const balanceBefore = account.balance;
    account.balance = parseFloat((balanceBefore + depositAmount).toFixed(2));

    const transaction = {
      id: uuidv4(), accountId: account.id, type: 'DEPOSIT',
      amount: depositAmount, balanceBefore, balanceAfter: account.balance,
      description: description || 'Dépôt', createdAt: new Date().toISOString()
    };
    store.transactions.push(transaction);

    return res.status(200).json({ message: 'Dépôt effectué.', transaction, newBalance: account.balance });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

/**
 * @swagger
 * /api/accounts/{id}/withdraw:
 *   post:
 *     summary: Effectuer un retrait
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 200
 *               description:
 *                 type: string
 *                 example: Loyer
 *     responses:
 *       200:
 *         description: Retrait effectué avec succès
 *       422:
 *         description: Solde insuffisant
 *       404:
 *         description: Compte introuvable
 */
router.post('/:id/withdraw', (req, res) => {
  try {
    const { amount, description } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ error: 'Le montant doit être strictement positif.' });
    }

    const account = store.accounts.find(a => a.id === req.params.id);
    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });
    if (req.user.role === 'client' && account.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    if (account.status !== 'ACTIVE') {
      return res.status(403).json({ error: `Compte ${account.status}.` });
    }
    if (account.balance < withdrawAmount) {
      return res.status(422).json({
        error: 'Solde insuffisant.',
        currentBalance: account.balance,
        requestedAmount: withdrawAmount,
        shortfall: parseFloat((withdrawAmount - account.balance).toFixed(2))
      });
    }

    const balanceBefore = account.balance;
    account.balance = parseFloat((balanceBefore - withdrawAmount).toFixed(2));

    const transaction = {
      id: uuidv4(), accountId: account.id, type: 'WITHDRAWAL',
      amount: withdrawAmount, balanceBefore, balanceAfter: account.balance,
      description: description || 'Retrait', createdAt: new Date().toISOString()
    };
    store.transactions.push(transaction);

    return res.status(200).json({ message: 'Retrait effectué.', transaction, newBalance: account.balance });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

/**
 * @swagger
 * /api/accounts/{id}/transactions:
 *   get:
 *     summary: Historique des transactions d'un compte
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAWAL]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des transactions
 *       404:
 *         description: Compte introuvable
 */
router.get('/:id/transactions', (req, res) => {
  try {
    const account = store.accounts.find(a => a.id === req.params.id);
    if (!account) return res.status(404).json({ error: 'Compte introuvable.' });
    if (req.user.role === 'client' && account.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }

    const { type, page = 1, limit = 20 } = req.query;
    let transactions = store.transactions.filter(t => t.accountId === account.id);
    if (type) transactions = transactions.filter(t => t.type === type.toUpperCase());

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const total    = transactions.length;
    const paginated = transactions.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return res.status(200).json({
      accountId: account.id,
      accountNumber: account.accountNumber,
      data: paginated,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

module.exports = router;