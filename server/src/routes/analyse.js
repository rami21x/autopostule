const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { analyzeProfileVsTarget } = require('../services/llm');

const router = express.Router();

// POST /analyse — Analyser le CV vs une cible (entreprise ou offre)
router.post('/', authMiddleware, async (req, res) => {
  const { target } = req.body;

  if (!target) {
    return res.status(400).json({ error: 'Aucune cible fournie pour l\'analyse' });
  }

  try {
    // Récupérer le profil
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tu dois d\'abord uploader ton CV' });
    }

    const profile = profileResult.rows[0];

    // Parser les formations et experiences si nécessaire
    if (typeof profile.formations === 'string') {
      profile.formations = JSON.parse(profile.formations);
    }
    if (typeof profile.experiences === 'string') {
      profile.experiences = JSON.parse(profile.experiences);
    }

    // Appel LLM pour l'analyse
    const analyse = await analyzeProfileVsTarget(profile, target);

    res.json({
      message: 'Analyse terminée',
      analyse,
    });
  } catch (err) {
    console.error('Erreur analyse :', err);
    res.status(500).json({ error: `Erreur lors de l'analyse: ${err.message}` });
  }
});

module.exports = router;
