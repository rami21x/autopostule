const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `Tu es un assistant spécialisé dans l'analyse de CV. À partir du texte brut d'un CV, extrais les informations structurées suivantes et retourne UNIQUEMENT un JSON valide, sans aucun texte avant ou après.

Format attendu :
{
  "first_name": "string",
  "last_name": "string",
  "phone": "string ou null",
  "city": "string ou null",
  "skills": ["compétence1", "compétence2", ...],
  "soft_skills": ["soft skill1", "soft skill2", ...],
  "formations": [
    {
      "diplome": "string",
      "etablissement": "string",
      "annee": "string",
      "description": "string ou null"
    }
  ],
  "experiences": [
    {
      "poste": "string",
      "entreprise": "string",
      "periode": "string",
      "description": "string ou null"
    }
  ]
}

Règles :
- Si une information n'est pas trouvée, mets null pour les strings ou un tableau vide pour les listes.
- Pour les skills, sépare bien les compétences techniques (skills) des compétences comportementales (soft_skills).
- Retourne UNIQUEMENT le JSON, rien d'autre.`;

async function extractProfileFromCV(cvText) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nVoici le texte du CV :\n\n${cvText}`,
      },
    ],
  });

  const responseText = message.content[0].text;

  // Extraire le JSON de la réponse (au cas où il y aurait du texte autour)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Le LLM n\'a pas retourné de JSON valide');
  }

  return JSON.parse(jsonMatch[0]);
}

const SEARCH_PROMPT = `Tu es un assistant spécialisé dans la recherche d'alternance et de stage en France. À partir du profil d'un étudiant et de ses préférences, tu dois identifier des entreprises et des offres pertinentes.

Tu dois retourner UNIQUEMENT un JSON valide, sans aucun texte avant ou après, avec le format suivant :

{
  "entreprises": [
    {
      "nom": "Nom de l'entreprise",
      "secteur": "Secteur d'activité",
      "ville": "Ville",
      "taille": "PME / ETI / Grande entreprise / Startup",
      "description": "Pourquoi cette entreprise correspond au profil (2-3 phrases)",
      "pourquoi_postuler": "Argument clé pour motiver la candidature spontanée",
      "score": 85,
      "contact_cible": "Type de contact à cibler (ex: RH, CTO, responsable technique)",
      "source": "spontanee"
    }
  ],
  "offres": [
    {
      "titre": "Titre du poste",
      "entreprise": "Nom de l'entreprise",
      "ville": "Ville",
      "type_contrat": "Alternance / Stage",
      "description": "Description courte du poste et pourquoi ça matche",
      "competences_requises": ["comp1", "comp2"],
      "score": 78,
      "source": "offre"
    }
  ]
}

Règles :
- Génère exactement 5 entreprises pour candidature spontanée et 5 offres potentielles.
- Le score est sur 100, basé sur la correspondance entre le profil et l'entreprise/offre.
- Les entreprises doivent être des entreprises RÉELLES existant en France.
- Priorise la localisation demandée par l'étudiant.
- Pour les candidatures spontanées, cible des entreprises qui recrutent dans le secteur même si elles n'ont pas d'offre publiée.
- Adapte les résultats au niveau d'études et aux compétences du profil.
- Retourne UNIQUEMENT le JSON, rien d'autre.`;

async function searchCompaniesAndOffers(profile, preferences) {
  const profileSummary = `
Étudiant : ${profile.first_name} ${profile.last_name}
Ville : ${profile.city || 'Non précisée'}
Compétences techniques : ${(profile.skills || []).join(', ') || 'Non précisées'}
Soft skills : ${(profile.soft_skills || []).join(', ') || 'Non précisés'}
Formations : ${JSON.stringify(profile.formations || [])}
Expériences : ${JSON.stringify(profile.experiences || [])}

Préférences :
- Secteur : ${preferences?.sector || 'Tous secteurs'}
- Type de contrat : ${preferences?.contract_type || 'Alternance ou stage'}
- Localisation : ${preferences?.location || 'France entière'}
- Mots-clés : ${(preferences?.keywords || []).join(', ') || 'Aucun'}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${SEARCH_PROMPT}\n\nVoici le profil de l'étudiant :\n${profileSummary}`,
      },
    ],
  });

  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Le LLM n\'a pas retourné de JSON valide');
  }

  return JSON.parse(jsonMatch[0]);
}

module.exports = { extractProfileFromCV, searchCompaniesAndOffers };
