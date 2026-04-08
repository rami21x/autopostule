const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const { extractProfileFromCV, suggestSkillsForDomain, generateExperienceDescription } = require('../services/llm');

const router = express.Router();

// Multer en mémoire (on ne stocke pas le fichier PDF, juste le texte)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
    cb(null, true);
  },
});

// POST /profile/cv — Upload CV + extraction LLM
router.post('/cv', authMiddleware, upload.single('cv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier PDF fourni' });
  }

  try {
    // 1. Extraire le texte brut du PDF
    const pdfData = await pdfParse(req.file.buffer);
    const rawText = pdfData.text;

    if (!rawText || rawText.trim().length < 50) {
      return res.status(400).json({ error: 'Le PDF ne contient pas assez de texte exploitable' });
    }

    // 2. Stocker le texte brut dans cv_data
    await pool.query(
      `INSERT INTO cv_data (user_id, raw_text)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET raw_text = $2, created_at = NOW()`,
      [req.user.id, rawText]
    );

    // 3. Appeler le LLM pour extraire le profil structuré
    const extracted = await extractProfileFromCV(rawText);

    // 4. Stocker le profil extrait dans cv_data.extracted_data
    await pool.query(
      `UPDATE cv_data SET extracted_data = $1 WHERE user_id = $2`,
      [JSON.stringify(extracted), req.user.id]
    );

    // 5. Mettre à jour ou créer le profil dans profiles
    await pool.query(
      `INSERT INTO profiles (user_id, first_name, last_name, phone, city, skills, soft_skills, formations, experiences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id)
       DO UPDATE SET
         first_name = $2, last_name = $3, phone = $4, city = $5,
         skills = $6, soft_skills = $7, formations = $8, experiences = $9,
         updated_at = NOW()`,
      [
        req.user.id,
        extracted.first_name,
        extracted.last_name,
        extracted.phone,
        extracted.city,
        extracted.skills || [],
        extracted.soft_skills || [],
        JSON.stringify(extracted.formations || []),
        JSON.stringify(extracted.experiences || []),
      ]
    );

    res.json({
      message: 'CV analysé avec succès',
      profile: extracted,
    });
  } catch (err) {
    console.error('[Profile] CV upload error:', err.message);
    if (err.message === 'Seuls les fichiers PDF sont acceptés') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Erreur lors de l\'analyse du CV. Réessaye.' });
  }
});

// GET /profile — Récupérer le profil complet (profil + préférences)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const profileResult = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.user.id]
    );

    const preferencesResult = await pool.query(
      'SELECT * FROM preferences WHERE user_id = $1',
      [req.user.id]
    );

    const cvDataResult = await pool.query(
      'SELECT extracted_data, created_at FROM cv_data WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      profile: profileResult.rows[0] || null,
      preferences: preferencesResult.rows[0] || null,
      cvUploaded: cvDataResult.rows.length > 0,
      cvUploadedAt: cvDataResult.rows[0]?.created_at || null,
    });
  } catch (err) {
    console.error('Erreur GET profil :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /profile/preferences — Sauvegarder les préférences
router.post('/preferences', authMiddleware, async (req, res) => {
  const { sector, contract_type, location, keywords } = req.body;

  if (!sector && !contract_type && !location && (!keywords || keywords.length === 0)) {
    return res.status(400).json({ error: 'Au moins un champ de préférence est requis' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO preferences (user_id, sector, contract_type, location, keywords)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET
         sector = $2, contract_type = $3, location = $4, keywords = $5,
         updated_at = NOW()
       RETURNING *`,
      [
        req.user.id,
        sector || null,
        contract_type || null,
        location || null,
        keywords || [],
      ]
    );

    res.json({
      message: 'Préférences sauvegardées',
      preferences: result.rows[0],
    });
  } catch (err) {
    console.error('Erreur préférences :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /profile/suggest-skills — IA suggère des compétences pour un domaine
router.post('/suggest-skills', authMiddleware, async (req, res) => {
  const { sector, formations, experiences } = req.body;

  if (!sector) {
    return res.status(400).json({ error: 'Le secteur est requis' });
  }

  try {
    const suggestions = await suggestSkillsForDomain(sector, formations, experiences);
    res.json(suggestions);
  } catch (err) {
    console.error('Erreur suggest-skills :', err.message);
    res.status(500).json({ error: 'Erreur lors de la suggestion de compétences' });
  }
});

// POST /profile/generate-description — IA génère une description d'expérience
router.post('/generate-description', authMiddleware, async (req, res) => {
  const { poste, entreprise, periode, sector } = req.body;

  if (!poste || !entreprise) {
    return res.status(400).json({ error: 'Le poste et l\'entreprise sont requis' });
  }

  try {
    const result = await generateExperienceDescription(poste, entreprise, periode, sector);
    res.json(result);
  } catch (err) {
    console.error('Erreur generate-description :', err.message);
    res.status(500).json({ error: 'Erreur lors de la génération de la description' });
  }
});

// POST /profile/cv-builder — Sauvegarder un CV construit manuellement
router.post('/cv-builder', authMiddleware, async (req, res) => {
  const { first_name, last_name, phone, city, formations, experiences, skills, soft_skills } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Le prénom et le nom sont requis' });
  }

  try {
    // 1. Stocker dans cv_data avec marqueur
    const rawText = '[CV construit manuellement]';
    const extractedData = { first_name, last_name, phone, city, skills, soft_skills, formations, experiences };

    await pool.query(
      `INSERT INTO cv_data (user_id, raw_text, extracted_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET raw_text = $2, extracted_data = $3, created_at = NOW()`,
      [req.user.id, rawText, JSON.stringify(extractedData)]
    );

    // 2. Mettre à jour le profil
    await pool.query(
      `INSERT INTO profiles (user_id, first_name, last_name, phone, city, skills, soft_skills, formations, experiences)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id)
       DO UPDATE SET
         first_name = $2, last_name = $3, phone = $4, city = $5,
         skills = $6, soft_skills = $7, formations = $8, experiences = $9,
         updated_at = NOW()`,
      [
        req.user.id,
        first_name,
        last_name,
        phone || null,
        city || null,
        skills || [],
        soft_skills || [],
        JSON.stringify(formations || []),
        JSON.stringify(experiences || []),
      ]
    );

    res.json({
      message: 'CV construit et sauvegardé avec succès',
      profile: extractedData,
    });
  } catch (err) {
    console.error('Erreur cv-builder :', err.message);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde du CV' });
  }
});

module.exports = router;
