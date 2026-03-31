const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { generateRelanceMessage } = require('../services/llm');

const router = express.Router();

// GET /candidatures — Liste des candidatures de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        l.content AS lettre_content,
        l.id AS lettre_id,
        r.id AS relance_id,
        r.suggested_message AS relance_message,
        r.sent AS relance_sent,
        r.suggested_at AS relance_suggested_at
      FROM candidatures c
      LEFT JOIN LATERAL (
        SELECT id, content FROM lettres WHERE candidature_id = c.id ORDER BY created_at DESC LIMIT 1
      ) l ON true
      LEFT JOIN LATERAL (
        SELECT id, suggested_message, sent, suggested_at FROM relances WHERE candidature_id = c.id ORDER BY suggested_at DESC LIMIT 1
      ) r ON true
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    // Calculer les relances a suggerer (statut "envoye" depuis plus de 7 jours)
    const candidatures = result.rows.map((c) => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...c,
        needs_relance: c.status === 'envoye' && daysSinceUpdate >= 7 && !c.relance_message,
        days_since_update: daysSinceUpdate,
      };
    });

    res.json({ candidatures });
  } catch (err) {
    console.error('Erreur GET candidatures :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// PUT /candidatures/:id/status — Changer le statut d'une candidature
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['a_envoyer', 'envoye', 'relance', 'repondu', 'refuse'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Statut invalide. Valeurs possibles : ${validStatuses.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `UPDATE candidatures SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    res.json({ candidature: result.rows[0] });
  } catch (err) {
    console.error('Erreur PUT statut :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// POST /candidatures/:id/relance — Générer une suggestion de relance
router.post('/:id/relance', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Récupérer la candidature
    const candResult = await pool.query(
      'SELECT * FROM candidatures WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (candResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    const candidature = candResult.rows[0];

    // Récupérer le profil
    const profileResult = await pool.query(
      'SELECT first_name, last_name FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0] || {};

    // Générer le message de relance via LLM
    const message = await generateRelanceMessage(profile, candidature);

    // Sauvegarder en base
    const relanceResult = await pool.query(
      `INSERT INTO relances (candidature_id, suggested_message)
       VALUES ($1, $2)
       RETURNING *`,
      [id, message]
    );

    res.json({
      relance: relanceResult.rows[0],
    });
  } catch (err) {
    console.error('Erreur génération relance :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// PUT /candidatures/:id/relance/sent — Marquer la relance comme envoyée
router.put('/:id/relance/sent', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Mettre à jour la dernière relance
    await pool.query(
      `UPDATE relances SET sent = true, sent_at = NOW()
       WHERE candidature_id = $1 AND sent = false
       AND candidature_id IN (SELECT id FROM candidatures WHERE user_id = $2)`,
      [id, req.user.id]
    );

    // Mettre à jour le statut de la candidature
    await pool.query(
      `UPDATE candidatures SET status = 'relance', updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ message: 'Relance marquée comme envoyée' });
  } catch (err) {
    console.error('Erreur relance sent :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// DELETE /candidatures/:id — Supprimer une candidature
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM candidatures WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    res.json({ message: 'Candidature supprimée' });
  } catch (err) {
    console.error('Erreur DELETE candidature :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

module.exports = router;
