const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { generateCoverLetter, regenerateLetterSection } = require('../services/llm');

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

    // Récupérer l'email du user
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [req.user.id]
    );
    const userEmail = userResult.rows[0]?.email || '';

    // Appel LLM pour générer la lettre
    const lettre = await generateCoverLetter(profile, target, analyse, userEmail);

    res.json({
      message: 'Lettre générée',
      lettre,
    });
  } catch (err) {
    console.error('Erreur génération lettre :', err);
    res.status(500).json({ error: 'Erreur lors de la génération. Réessaye.' });
  }
});

// POST /lettre/regenerate-section — Régénérer une section de la lettre
router.post('/regenerate-section', authMiddleware, async (req, res) => {
  const { section, target, instructions } = req.body;

  if (!section) {
    return res.status(400).json({ error: 'La section à régénérer est requise' });
  }

  try {
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0];
    const candidat = profile
      ? `${profile.first_name} ${profile.last_name}, compétences: ${(profile.skills || []).join(', ')}`
      : 'Étudiant';
    const cible = target
      ? `${target.nom || target.titre} - ${target.secteur || target.entreprise} (${target.ville})`
      : 'Entreprise';

    const result = await regenerateLetterSection(section, candidat, cible, instructions);
    res.json(result);
  } catch (err) {
    console.error('Erreur regenerate-section :', err);
    res.status(500).json({ error: 'Erreur lors de la régénération' });
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
      const searchQuery = encodeURIComponent(`${companyName} recrutement ${jobTitle}`);
      const autoApplyUrl = `https://www.google.com/search?q=${searchQuery}`;
      const insertResult = await pool.query(
        `INSERT INTO candidatures (user_id, company_name, job_title, score, status, source, apply_url)
         VALUES ($1, $2, $3, $4, 'a_envoyer', $5, $6)
         RETURNING id`,
        [req.user.id, companyName, jobTitle, score, target?.type || 'spontanee', autoApplyUrl]
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
    res.status(500).json({ error: 'Erreur lors de la sauvegarde. Réessaye.' });
  }
});

module.exports = router;
