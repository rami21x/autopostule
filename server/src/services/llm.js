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

const ANALYSE_PROMPT = `Tu es un expert en recrutement et en coaching de candidature en France. On te donne le profil d'un étudiant et une entreprise ou offre cible. Tu dois analyser la correspondance entre les deux et proposer des améliorations concrètes.

Retourne UNIQUEMENT un JSON valide avec le format suivant :

{
  "score_detaille": {
    "competences": 75,
    "experience": 60,
    "formation": 80,
    "localisation": 90,
    "global": 76
  },
  "points_forts": [
    "Description d'un point fort du profil par rapport à cette cible (1 phrase)"
  ],
  "lacunes": [
    "Description d'une lacune identifiée (1 phrase)"
  ],
  "suggestions_generales": [
    {
      "categorie": "CV" | "Compétences" | "Expérience" | "Formation" | "Présentation",
      "titre": "Titre court de la suggestion",
      "description": "Explication détaillée de ce qu'il faut améliorer et comment (2-3 phrases)",
      "priorite": "haute" | "moyenne" | "basse"
    }
  ],
  "suggestions_specifiques": [
    {
      "categorie": "Vocabulaire" | "Projet à mentionner" | "Technologie" | "Culture d'entreprise" | "Actualité",
      "titre": "Titre court de la suggestion spécifique à cette entreprise",
      "description": "Conseil adapté spécifiquement à cette entreprise (2-3 phrases)",
      "priorite": "haute" | "moyenne" | "basse"
    }
  ],
  "infos_entreprise": {
    "description": "Description de l'entreprise (2-3 phrases)",
    "valeurs": ["valeur1", "valeur2"],
    "stack_technique": ["tech1", "tech2"],
    "actualites": "Une actualité récente pertinente de l'entreprise (1 phrase, ou null)",
    "conseil_approche": "Comment approcher cette entreprise spécifiquement (1-2 phrases)"
  }
}

Règles :
- Propose au moins 3 suggestions générales et 3 suggestions spécifiques.
- Les suggestions doivent être concrètes et actionnables, pas des conseils génériques.
- Les scores détaillés sont sur 100.
- Adapte les suggestions spécifiques à l'entreprise réelle ciblée.
- Retourne UNIQUEMENT le JSON, rien d'autre.`;

async function analyzeProfileVsTarget(profile, target) {
  const profileSummary = `
Étudiant : ${profile.first_name} ${profile.last_name}
Ville : ${profile.city || 'Non précisée'}
Compétences techniques : ${(profile.skills || []).join(', ') || 'Non précisées'}
Soft skills : ${(profile.soft_skills || []).join(', ') || 'Non précisés'}
Formations : ${JSON.stringify(profile.formations || [])}
Expériences : ${JSON.stringify(profile.experiences || [])}`;

  const targetSummary = target.type === 'entreprise'
    ? `Entreprise ciblée :
- Nom : ${target.nom}
- Secteur : ${target.secteur}
- Ville : ${target.ville}
- Taille : ${target.taille}
- Description : ${target.description}
- Contact cible : ${target.contact_cible}
- Type : Candidature spontanée`
    : `Offre ciblée :
- Titre : ${target.titre}
- Entreprise : ${target.entreprise}
- Ville : ${target.ville}
- Type de contrat : ${target.type_contrat}
- Description : ${target.description}
- Compétences requises : ${(target.competences_requises || []).join(', ')}
- Type : Réponse à une offre`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `${ANALYSE_PROMPT}\n\nProfil de l'étudiant :\n${profileSummary}\n\n${targetSummary}`,
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

const LETTRE_PROMPT = `Tu es un expert en rédaction de lettres de motivation pour des étudiants français en recherche d'alternance ou de stage. Tu dois rédiger une lettre de motivation personnalisée, professionnelle et convaincante.

La lettre doit :
- Faire entre 250 et 400 mots
- Être structurée en 3-4 paragraphes :
  1. Accroche : pourquoi cette entreprise spécifiquement (montrer qu'on a fait ses recherches)
  2. Parcours : mettre en valeur les compétences et expériences pertinentes pour ce poste
  3. Adéquation : ce que l'étudiant apportera concrètement à l'entreprise
  4. Conclusion : disponibilités, motivation, appel à l'action
- Être personnalisée pour cette entreprise spécifique (pas de lettre générique)
- Mentionner des éléments concrets du profil de l'étudiant
- Utiliser un ton professionnel mais dynamique, adapté à un étudiant
- Ne PAS commencer par "Madame, Monsieur" ni terminer par les formules classiques trop longues
- Commencer directement par l'accroche
- Terminer par une phrase courte et percutante

Retourne UNIQUEMENT un JSON valide :
{
  "objet": "Objet de la lettre (ex: Candidature en alternance - Développeur Full-Stack)",
  "contenu": "Le texte complet de la lettre de motivation",
  "points_cles_utilises": ["Point clé du profil utilisé dans la lettre"],
  "ton": "Description du ton adopté (1 phrase)"
}

Retourne UNIQUEMENT le JSON, rien d'autre.`;

async function generateCoverLetter(profile, target, analyse) {
  const profileSummary = `
Étudiant : ${profile.first_name} ${profile.last_name}
Ville : ${profile.city || 'Non précisée'}
Compétences techniques : ${(profile.skills || []).join(', ') || 'Non précisées'}
Soft skills : ${(profile.soft_skills || []).join(', ') || 'Non précisés'}
Formations : ${JSON.stringify(profile.formations || [])}
Expériences : ${JSON.stringify(profile.experiences || [])}`;

  const targetSummary = target.type === 'entreprise'
    ? `Entreprise : ${target.nom} (${target.secteur}, ${target.ville}, ${target.taille})
Description : ${target.description}
Pourquoi postuler : ${target.pourquoi_postuler || ''}`
    : `Offre : ${target.titre} chez ${target.entreprise} (${target.ville})
Type : ${target.type_contrat}
Description : ${target.description}
Compétences demandées : ${(target.competences_requises || []).join(', ')}`;

  const analyseSummary = analyse ? `
Points forts identifiés : ${(analyse.points_forts || []).join('; ')}
Infos entreprise : ${analyse.infos_entreprise?.description || ''}
Valeurs : ${(analyse.infos_entreprise?.valeurs || []).join(', ')}
Stack technique : ${(analyse.infos_entreprise?.stack_technique || []).join(', ')}
Conseil d'approche : ${analyse.infos_entreprise?.conseil_approche || ''}` : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `${LETTRE_PROMPT}\n\nProfil :\n${profileSummary}\n\nCible :\n${targetSummary}\n${analyseSummary}`,
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

async function generateRelanceMessage(profile, candidature) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `Tu es un assistant spécialisé en recherche d'alternance. Rédige un court message de relance (5-8 phrases max) pour un étudiant qui a postulé et n'a pas eu de réponse.

Étudiant : ${profile.first_name || ''} ${profile.last_name || ''}
Entreprise : ${candidature.company_name}
Poste : ${candidature.job_title}
Date de candidature : ${new Date(candidature.created_at).toLocaleDateString('fr-FR')}

Le message doit être :
- Poli et professionnel mais pas trop formel
- Court et direct
- Rappeler la candidature sans être insistant
- Montrer la motivation sans désespoir
- Proposer un échange ou un entretien

Retourne UNIQUEMENT le texte du message, sans guillemets ni formatage.`,
      },
    ],
  });

  return message.content[0].text;
}

const SUGGEST_SKILLS_PROMPT = `Tu es un expert en recrutement et en compétences professionnelles en France. À partir du domaine/secteur recherché par un étudiant et de ses informations (formations, expériences), tu dois suggérer des compétences techniques et soft skills pertinentes.

Tu dois aussi analyser les profils recherchés dans ce domaine et proposer des compétences basées sur ce que les recruteurs attendent réellement.

Retourne UNIQUEMENT un JSON valide :
{
  "skills": ["compétence technique 1", "compétence technique 2", ...],
  "soft_skills": ["soft skill 1", "soft skill 2", ...],
  "skills_tendance": ["compétence émergente 1", "compétence émergente 2"],
  "conseil": "Un conseil court (1-2 phrases) sur les compétences les plus demandées dans ce secteur"
}

Règles :
- Propose 8-12 compétences techniques pertinentes pour le secteur.
- Propose 5-8 soft skills valorisées dans ce secteur.
- Propose 3-5 compétences tendance/émergentes que les recruteurs recherchent de plus en plus.
- Base-toi sur les offres d'emploi réelles en France pour ce secteur.
- Adapte les suggestions au niveau étudiant (alternance/stage).
- Retourne UNIQUEMENT le JSON, rien d'autre.`;

async function suggestSkillsForDomain(sector, formations, experiences) {
  const context = `
Secteur recherché : ${sector}
Formations : ${JSON.stringify(formations || [])}
Expériences : ${JSON.stringify(experiences || [])}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `${SUGGEST_SKILLS_PROMPT}\n\n${context}`,
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

const GENERATE_DESCRIPTION_PROMPT = `Tu es un expert en rédaction de CV en France. À partir des informations basiques d'une expérience professionnelle, tu dois rédiger une description professionnelle et percutante.

Retourne UNIQUEMENT un JSON valide :
{
  "description": "Description professionnelle de l'expérience (2-4 phrases, action-oriented, avec des verbes d'action et si possible des résultats chiffrés)"
}

Règles :
- Utilise des verbes d'action (Développé, Géré, Mis en place, Contribué, Optimisé, etc.)
- Adapte le ton au secteur et au poste.
- Si le secteur est technique, mentionne des outils/technologies probables.
- Reste réaliste pour un étudiant en alternance/stage.
- Retourne UNIQUEMENT le JSON, rien d'autre.`;

async function generateExperienceDescription(poste, entreprise, periode, sector) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `${GENERATE_DESCRIPTION_PROMPT}\n\nPoste : ${poste}\nEntreprise : ${entreprise}\nPériode : ${periode}\nSecteur de l'étudiant : ${sector || 'Non précisé'}`,
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

module.exports = { extractProfileFromCV, searchCompaniesAndOffers, analyzeProfileVsTarget, generateCoverLetter, generateRelanceMessage, suggestSkillsForDomain, generateExperienceDescription };
