const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const store = require('./store');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('./config');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Inscription et connexion
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Jean
 *               lastName:
 *                 type: string
 *                 example: Dupont
 *               email:
 *                 type: string
 *                 example: jean@test.com
 *               password:
 *                 type: string
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [client, admin]
 *                 example: client
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'client' } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants : firstName, lastName, email, password.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format email invalide.' });
    }

    const existingUser = store.users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    const validRoles = ['client', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rôle invalide. Valeurs acceptées : ${validRoles.join(', ')}` });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = {
      id: uuidv4(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    store.users.push(newUser);

    const { passwordHash: _, ...userResponse } = newUser;
    return res.status(201).json({
      message: 'Utilisateur créé avec succès.',
      user: userResponse
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Connexion et obtention du token JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: jean@test.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Connexion réussie, token JWT retourné
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = store.users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { passwordHash: _, ...userResponse } = user;
    return res.status(200).json({
      message: 'Connexion réussie.',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: userResponse
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur interne.', details: err.message });
  }
});

module.exports = router;