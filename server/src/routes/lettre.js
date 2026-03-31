const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { generateCoverLetter } = require('../services/llm');

const router = express.Router();

// POST /lettre/generate — Générer une lettre de motivation
router.post('/generate', authMiddleware, async (req, res) => {
  const { target, analyse } = req.body;

  if (!target) {
    return res.status(400).json({ error: 'Aucune cible fournie pour la lettre' });
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

    if (typeof profile.formations === 'string') {
      profile.formations = JSON.parse(profile.formations);
    }
    if (typeof profile.experiences === 'string') {
      profile.experiences = JSON.parse(profile.experiences);
    }

    // Appel LLM pour générer la lettre
    const lettre = await generateCoverLetter(profile, target, analyse);

    res.json({
      message: 'Lettre générée',
      lettre,
    });
  } catch (err) {
    console.error('Erreur génération lettre :', err);
    res.status(500).json({ error: `Erreur lors de la génération: ${err.message}` });
  }
});

// POST /lettre/save — Sauvegarder une lettre (liée à une candidature)
router.post('/save', authMiddleware, async (req, res) => {
  const { target, content, objet } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Le contenu de la lettre est requis' });
  }

  try {
    // Créer ou récupérer la candidature associée
    const companyName = target?.nom || target?.entreprise || 'Entreprise inconnue';
    const jobTitle = target?.titre || objet || 'Candidature spontanée';
    const score = target?.score || null;

    let candidatureResult = await pool.query(
      `SELECT id FROM candidatures WHERE user_id = $1 AND company_name = $2 AND job_title = $3`,
      [req.user.id, companyName, jobTitle]
    );

    let candidatureId;

    if (candidatureResult.rows.length === 0) {
      // Créer la candidature
      const insertResult = await pool.query(
        `INSERT INTO candidatures (user_id, company_name, job_title, score, status, source)
         VALUES ($1, $2, $3, $4, 'a_envoyer', $5)
         RETURNING id`,
        [req.user.id, companyName, jobTitle, score, target?.type || 'spontanee']
      );
      candidatureId = insertResult.rows[0].id;
    } else {
      candidatureId = candidatureResult.rows[0].id;
    }

    // Sauvegarder la lettre
    const lettreResult = await pool.query(
      `INSERT INTO lettres (candidature_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [candidatureId, req.user.id, content]
    );

    res.json({
      message: 'Lettre sauvegardée et candidature créée',
      lettre: lettreResult.rows[0],
      candidature_id: candidatureId,
    });
  } catch (err) {
    console.error('Erreur sauvegarde lettre :', err);
    res.status(500).json({ error: `Erreur lors de la sauvegarde: ${err.message}` });
  }
});

module.exports = router;
