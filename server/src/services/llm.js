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

module.exports = { extractProfileFromCV };
