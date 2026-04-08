const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { searchCompaniesAndOffers, searchMoreResults } = require('../services/llm');

const router = express.Router();

// POST /search/launch — Lancer une recherche intelligente (3 axes)
router.post('/launch', authMiddleware, async (req, res) => {
  try {
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Tu dois d\'abord uploader ton CV avant de lancer une recherche',
      });
    }

    const preferencesResult = await pool.query(
      'SELECT * FROM preferences WHERE user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0];
    const preferences = preferencesResult.rows[0] || null;

    if (typeof profile.formations === 'string') {
      profile.formations = JSON.parse(profile.formations);
    }
    if (typeof profile.experiences === 'string') {
      profile.experiences = JSON.parse(profile.experiences);
    }

    const results = await searchCompaniesAndOffers(profile, preferences);

    res.json({
      message: 'Recherche terminée',
      entreprises: results.entreprises || { exact: [], connexe: [], profil: [] },
      offres: results.offres || { exact: [], connexe: [], profil: [] },
    });
  } catch (err) {
    console.error('[Search] Error:', err.message);
    res.status(500).json({ error: 'Erreur lors de la recherche. Réessaye.' });
  }
});

// POST /search/more — Charger plus de résultats
router.post('/more', authMiddleware, async (req, res) => {
  const { existingNames } = req.body;

  try {
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({ error: 'Profil non trouvé' });
    }

    const preferencesResult = await pool.query(
      'SELECT * FROM preferences WHERE user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0];
    const preferences = preferencesResult.rows[0] || null;

    if (typeof profile.formations === 'string') {
      profile.formations = JSON.parse(profile.formations);
    }
    if (typeof profile.experiences === 'string') {
      profile.experiences = JSON.parse(profile.experiences);
    }

    const results = await searchMoreResults(profile, preferences, existingNames || []);

    res.json({
      message: 'Résultats supplémentaires chargés',
      entreprises: results.entreprises || { exact: [], connexe: [], profil: [] },
      offres: results.offres || { exact: [], connexe: [], profil: [] },
    });
  } catch (err) {
    console.error('[Search] More error:', err.message);
    res.status(500).json({ error: 'Erreur lors du chargement. Réessaye.' });
  }
});

module.exports = router;
