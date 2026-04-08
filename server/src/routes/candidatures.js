const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { generateRelanceMessage } = require('../services/llm');
const { sendCandidatureEmail, sendRelanceEmail, isEmailConfigured } = require('../services/email');

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
        r.suggested_at AS relance_suggested_at,
        r.sent_at AS relance_sent_at
      FROM candidatures c
      LEFT JOIN LATERAL (
        SELECT id, content FROM lettres WHERE candidature_id = c.id ORDER BY created_at DESC LIMIT 1
      ) l ON true
      LEFT JOIN LATERAL (
        SELECT id, suggested_message, sent, suggested_at, sent_at FROM relances WHERE candidature_id = c.id ORDER BY suggested_at DESC LIMIT 1
      ) r ON true
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    const candidatures = result.rows.map((c) => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const delayDays = c.relance_delay_days || 15;
      return {
        ...c,
        needs_relance: c.status === 'envoye' && daysSinceUpdate >= delayDays,
        days_since_update: daysSinceUpdate,
        relance_delay_days: delayDays,
      };
    });

    res.json({ candidatures, email_configured: isEmailConfigured() });
  } catch (err) {
    console.error('Erreur GET candidatures :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// PUT /candidatures/:id/status — Changer le statut d'une candidature
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['a_envoyer', 'envoye', 'relance', 'repondu', 'refuse', 'entretien'];
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

// PUT /candidatures/:id — Mettre à jour les champs d'une candidature (notes, contact_email, delai relance)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { notes, contact_email, relance_delay_days } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(notes); }
    if (contact_email !== undefined) { fields.push(`contact_email = $${idx++}`); values.push(contact_email); }
    if (relance_delay_days !== undefined) { fields.push(`relance_delay_days = $${idx++}`); values.push(relance_delay_days); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Rien à mettre à jour' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, req.user.id);

    const result = await pool.query(
      `UPDATE candidatures SET ${fields.join(', ')}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    res.json({ candidature: result.rows[0] });
  } catch (err) {
    console.error('Erreur PUT candidature :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// POST /candidatures/:id/send-email — Envoyer la lettre par email
router.post('/:id/send-email', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({ error: 'Adresse email du destinataire requise' });
  }

  try {
    // Récupérer la candidature + lettre
    const candResult = await pool.query(
      `SELECT c.*, l.content AS lettre_content
       FROM candidatures c
       LEFT JOIN LATERAL (
         SELECT content FROM lettres WHERE candidature_id = c.id ORDER BY created_at DESC LIMIT 1
       ) l ON true
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, req.user.id]
    );

    if (candResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    const candidature = candResult.rows[0];

    if (!candidature.lettre_content) {
      return res.status(400).json({ error: 'Aucune lettre sauvegardée pour cette candidature' });
    }

    // Récupérer le profil pour le nom
    const profileResult = await pool.query(
      'SELECT first_name, last_name FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    const profile = profileResult.rows[0] || {};
    const candidatName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

    // Envoyer l'email
    const emailResult = await sendCandidatureEmail({
      to,
      candidatName,
      companyName: candidature.company_name,
      jobTitle: candidature.job_title,
      lettreContent: candidature.lettre_content,
      objet: `Candidature — ${candidature.job_title || 'Alternance'} — ${candidatName}`,
    });

    // Logger l'envoi
    await pool.query(
      `INSERT INTO email_logs (candidature_id, user_id, type, recipient_email, subject, resend_id)
       VALUES ($1, $2, 'candidature', $3, $4, $5)`,
      [id, req.user.id, to, `Candidature — ${candidature.job_title}`, emailResult?.id || null]
    );

    // Sauvegarder l'email de contact + passer en statut envoyé
    await pool.query(
      `UPDATE candidatures SET contact_email = $1, status = 'envoye', updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [to, id, req.user.id]
    );

    res.json({ message: 'Email envoyé avec succès', email_id: emailResult?.id });
  } catch (err) {
    console.error('Erreur envoi email :', err);
    res.status(500).json({ error: `Erreur envoi email: ${err.message}` });
  }
});

// POST /candidatures/:id/relance — Générer une suggestion de relance
router.post('/:id/relance', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const candResult = await pool.query(
      'SELECT * FROM candidatures WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (candResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    const candidature = candResult.rows[0];

    const profileResult = await pool.query(
      'SELECT first_name, last_name FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    const profile = profileResult.rows[0] || {};

    const message = await generateRelanceMessage(profile, candidature);

    const relanceResult = await pool.query(
      `INSERT INTO relances (candidature_id, suggested_message)
       VALUES ($1, $2)
       RETURNING *`,
      [id, message]
    );

    res.json({ relance: relanceResult.rows[0] });
  } catch (err) {
    console.error('Erreur génération relance :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// POST /candidatures/:id/send-relance — Envoyer la relance par email
router.post('/:id/send-relance', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Adresse email et message requis' });
  }

  try {
    const candResult = await pool.query(
      'SELECT * FROM candidatures WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (candResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidature non trouvée' });
    }

    const candidature = candResult.rows[0];

    const profileResult = await pool.query(
      'SELECT first_name, last_name FROM profiles WHERE user_id = $1',
      [req.user.id]
    );
    const profile = profileResult.rows[0] || {};
    const candidatName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

    const emailResult = await sendRelanceEmail({
      to,
      candidatName,
      companyName: candidature.company_name,
      jobTitle: candidature.job_title,
      relanceContent: message,
    });

    // Logger l'envoi
    await pool.query(
      `INSERT INTO email_logs (candidature_id, user_id, type, recipient_email, subject, resend_id)
       VALUES ($1, $2, 'relance', $3, $4, $5)`,
      [id, req.user.id, to, `Relance — ${candidature.job_title}`, emailResult?.id || null]
    );

    // Marquer la relance comme envoyée
    await pool.query(
      `UPDATE relances SET sent = true, sent_at = NOW()
       WHERE candidature_id = $1 AND sent = false`,
      [id]
    );

    // Mettre à jour le statut
    await pool.query(
      `UPDATE candidatures SET status = 'relance', updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ message: 'Relance envoyée par email', email_id: emailResult?.id });
  } catch (err) {
    console.error('Erreur envoi relance email :', err);
    res.status(500).json({ error: `Erreur envoi relance: ${err.message}` });
  }
});

// PUT /candidatures/:id/relance/sent — Marquer la relance comme envoyée (manuellement)
router.put('/:id/relance/sent', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE relances SET sent = true, sent_at = NOW()
       WHERE candidature_id = $1 AND sent = false
       AND candidature_id IN (SELECT id FROM candidatures WHERE user_id = $2)`,
      [id, req.user.id]
    );

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

// GET /candidatures/:id/emails — Historique des emails pour une candidature
router.get('/:id/emails', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM email_logs
       WHERE candidature_id = $1 AND user_id = $2
       ORDER BY sent_at DESC`,
      [id, req.user.id]
    );

    res.json({ emails: result.rows });
  } catch (err) {
    console.error('Erreur GET emails :', err);
    res.status(500).json({ error: `Erreur: ${err.message}` });
  }
});

// GET /candidatures/export — Export CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT company_name, job_title, score, status, source, contact_email, notes, created_at, updated_at
       FROM candidatures WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const header = 'Entreprise,Poste,Score,Statut,Source,Email contact,Notes,Date creation,Derniere maj\n';
    const rows = result.rows.map(r =>
      [
        `"${(r.company_name || '').replace(/"/g, '""')}"`,
        `"${(r.job_title || '').replace(/"/g, '""')}"`,
        r.score || '',
        r.status,
        r.source || '',
        r.contact_email || '',
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        new Date(r.created_at).toLocaleDateString('fr-FR'),
        new Date(r.updated_at).toLocaleDateString('fr-FR'),
      ].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=candidatures.csv');
    res.send('\uFEFF' + header + rows);
  } catch (err) {
    console.error('Erreur export CSV :', err);
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
