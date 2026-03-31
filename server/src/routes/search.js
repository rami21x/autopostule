const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { searchCompaniesAndOffers } = require('../services/llm');

const router = express.Router();

// POST /search/launch — Lancer une recherche intelligente
router.post('/launch', authMiddleware, async (req, res) => {
  try {
    // Récupérer le profil
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Tu dois d\'abord uploader ton CV avant de lancer une recherche',
      });
    }

    // Récupérer les préférences
    const preferencesResult = await pool.query(
      'SELECT * FROM preferences WHERE user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0];
    const preferences = preferencesResult.rows[0] || null;

    // Parser les formations et experiences si nécessaire
    if (typeof profile.formations === 'string') {
      profile.formations = JSON.parse(profile.formations);
    }
    if (typeof profile.experiences === 'string') {
      profile.experiences = JSON.parse(profile.experiences);
    }

    // Appel LLM
    const results = await searchCompaniesAndOffers(profile, preferences);

    res.json({
      message: 'Recherche terminée',
      entreprises: results.entreprises || [],
      offres: results.offres || [],
    });
  } catch (err) {
    console.error('Erreur recherche :', err);
    res.status(500).json({ error: `Erreur lors de la recherche: ${err.message}` });
  }
});

module.exports = router;
