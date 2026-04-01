const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const pool = require('../db/pool');

const router = express.Router();

// Password validation helper
function validatePassword(password) {
  const errors = [];
  if (password.length < 12) errors.push('Minimum 12 caractères');
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Au moins un caractère spécial (!@#$...)');
  return errors;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ error: passwordErrors.join('. ') });
  }

  try {
    const existing = await pool.query('SELECT id, auth_provider FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const provider = existing.rows[0].auth_provider;
      if (provider === 'google') {
        return res.status(409).json({ error: 'Ce compte utilise Google. Connectez-vous avec Google.' });
      }
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, auth_provider) VALUES ($1, $2, $3) RETURNING id, email, created_at',
      [email, password_hash, 'local']
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Erreur register :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const result = await pool.query('SELECT id, email, password_hash, auth_provider FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // User registered via Google only (no password)
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Ce compte utilise Google. Connectez-vous avec Google.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Erreur login :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /auth/google — Start Google OAuth flow
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /auth/google/callback — Google redirects here
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth?error=google_failed' }),
  (req, res) => {
    const user = req.user;
    const token = generateToken(user);
    const userData = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email }));
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${token}&user=${userData}`);
  }
);

module.exports = router;
