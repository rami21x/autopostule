import { useState, useCallback } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import api from '../services/api';
import { TEMPLATES } from './CvTemplates';

export default function CvBuilder({ sector, onComplete }) {
  const [step, setStep] = useState(1); // 1: info perso, 2: formations+exp, 3: skills, 4: template+download
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [personalInfo, setPersonalInfo] = useState({ first_name: '', last_name: '', phone: '', city: '' });
  const [formations, setFormations] = useState([{ diplome: '', etablissement: '', annee: '' }]);
  const [experiences, setExperiences] = useState([{ poste: '', entreprise: '', periode: '', description: '' }]);
  const [skills, setSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('classique');

  // AI states
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const [skillsSuggested, setSkillsSuggested] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState({ skills: [], soft_skills: [], skills_tendance: [], conseil: '' });
  const [generatingDesc, setGeneratingDesc] = useState(null); // index of experience being generated

  // Build complete CV data object
  const getCvData = useCallback(() => ({
    first_name: personalInfo.first_name,
    last_name: personalInfo.last_name,
    phone: personalInfo.phone,
    city: personalInfo.city,
    formations: formations.filter(f => f.diplome),
    experiences: experiences.filter(e => e.poste),
    skills,
    soft_skills: softSkills,
  }), [personalInfo, formations, experiences, skills, softSkills]);

  // AI: suggest skills
  const handleSuggestSkills = async () => {
    setSuggestingSkills(true);
    setError('');
    try {
      const res = await api.post('/profile/suggest-skills', {
        sector,
        formations: formations.filter(f => f.diplome),
        experiences: experiences.filter(e => e.poste),
      });
      setSuggestedSkills(res.data);
      setSkillsSuggested(true);
    } catch (err) {
      setError('Erreur lors de la suggestion de compétences.');
    } finally {
      setSuggestingSkills(false);
    }
  };

  // AI: generate experience description
  const handleGenerateDescription = async (index) => {
    const exp = experiences[index];
    if (!exp.poste || !exp.entreprise) return;
    setGeneratingDesc(index);
    try {
      const res = await api.post('/profile/generate-description', {
        poste: exp.poste,
        entreprise: exp.entreprise,
        periode: exp.periode,
        sector,
      });
      const updated = [...experiences];
      updated[index] = { ...updated[index], description: res.data.description };
      setExperiences(updated);
    } catch (err) {
      setError('Erreur lors de la génération de la description.');
    } finally {
      setGeneratingDesc(null);
    }
  };

  // Save to backend
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const data = getCvData();
      const res = await api.post('/profile/cv-builder', data);
      onComplete(res.data.profile);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle skill selection
  const toggleSkill = (skill) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };
  const toggleSoftSkill = (skill) => {
    setSoftSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const addCustomSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  const addCustomSoftSkill = () => {
    if (newSoftSkill.trim() && !softSkills.includes(newSoftSkill.trim())) {
      setSoftSkills([...softSkills, newSoftSkill.trim()]);
      setNewSoftSkill('');
    }
  };

  const builderSteps = [
    { id: 1, label: 'Identité' },
    { id: 2, label: 'Parcours' },
    { id: 3, label: 'Compétences' },
    { id: 4, label: 'Finaliser' },
  ];

  const TemplateComponent = TEMPLATES.find(t => t.id === selectedTemplate)?.component;

  return (
    <div className="space-y-6">
      {/* Mini stepper */}
      <div className="flex items-center gap-2 mb-4">
        {builderSteps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 cursor-pointer text-left`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.id
                  ? 'bg-blue-600 text-white'
                  : s.id < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {s.id < step ? '✓' : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.id ? 'text-blue-700' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </button>
            {i < builderSteps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 rounded ${s.id < step ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* STEP 1: Personal info */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
              <input
                type="text"
                value={personalInfo.first_name}
                onChange={e => setPersonalInfo({ ...personalInfo, first_name: e.target.value })}
                placeholder="Ex: Jean"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
              <input
                type="text"
                value={personalInfo.last_name}
                onChange={e => setPersonalInfo({ ...personalInfo, last_name: e.target.value })}
                placeholder="Ex: Dupont"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="text"
                value={personalInfo.phone}
                onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                placeholder="Ex: 06 12 34 56 78"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
              <input
                type="text"
                value={personalInfo.city}
                onChange={e => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                placeholder="Ex: Paris"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!personalInfo.first_name || !personalInfo.last_name}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Suivant &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Formations + Experiences */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Formations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Formations</h3>
              <button
                onClick={() => setFormations([...formations, { diplome: '', etablissement: '', annee: '' }])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                + Ajouter une formation
              </button>
            </div>
            {formations.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Formation {i + 1}</span>
                  {formations.length > 1 && (
                    <button
                      onClick={() => setFormations(formations.filter((_, j) => j !== i))}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={f.diplome}
                  onChange={e => {
                    const updated = [...formations];
                    updated[i] = { ...updated[i], diplome: e.target.value };
                    setFormations(updated);
                  }}
                  placeholder="Diplôme (ex: Licence Informatique)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={f.etablissement}
                    onChange={e => {
                      const updated = [...formations];
                      updated[i] = { ...updated[i], etablissement: e.target.value };
                      setFormations(updated);
                    }}
                    placeholder="Établissement"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={f.annee}
                    onChange={e => {
                      const updated = [...formations];
                      updated[i] = { ...updated[i], annee: e.target.value };
                      setFormations(updated);
                    }}
                    placeholder="Année (ex: 2024)"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Experiences */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Expériences</h3>
              <button
                onClick={() => setExperiences([...experiences, { poste: '', entreprise: '', periode: '', description: '' }])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                + Ajouter une expérience
              </button>
            </div>
            {experiences.map((exp, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Expérience {i + 1}</span>
                  <div className="flex items-center gap-3">
                    {exp.poste && exp.entreprise && (
                      <button
                        onClick={() => handleGenerateDescription(i)}
                        disabled={generatingDesc === i}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {generatingDesc === i ? (
                          <>
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Génération...
                          </>
                        ) : (
                          <>✨ Générer automatiquement</>
                        )}
                      </button>
                    )}
                    {experiences.length > 1 && (
                      <button
                        onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}
                        className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={exp.poste}
                    onChange={e => {
                      const updated = [...experiences];
                      updated[i] = { ...updated[i], poste: e.target.value };
                      setExperiences(updated);
                    }}
                    placeholder="Poste (ex: Développeur Web)"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={exp.entreprise}
                    onChange={e => {
                      const updated = [...experiences];
                      updated[i] = { ...updated[i], entreprise: e.target.value };
                      setExperiences(updated);
                    }}
                    placeholder="Entreprise"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={exp.periode}
                  onChange={e => {
                    const updated = [...experiences];
                    updated[i] = { ...updated[i], periode: e.target.value };
                    setExperiences(updated);
                  }}
                  placeholder="Période (ex: Juin 2024 - Août 2024)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  value={exp.description}
                  onChange={e => {
                    const updated = [...experiences];
                    updated[i] = { ...updated[i], description: e.target.value };
                    setExperiences(updated);
                  }}
                  placeholder="Description (ou clique 'Générer automatiquement' ci-dessus)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              &larr; Retour
            </button>
            <button
              onClick={() => { setStep(3); if (!skillsSuggested) handleSuggestSkills(); }}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all cursor-pointer"
            >
              Suivant &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Skills */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Compétences</h3>
            {!suggestingSkills && (
              <button
                onClick={handleSuggestSkills}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium cursor-pointer flex items-center gap-1"
              >
                ✨ Régénérer les suggestions IA
              </button>
            )}
          </div>

          {suggestingSkills && (
            <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-purple-700">Analyse des profils recherchés dans le secteur "{sector}"</p>
                <p className="text-xs text-purple-500">Basé sur les vrais postes disponibles sur le marché...</p>
              </div>
            </div>
          )}

          {skillsSuggested && (
            <>
              {/* AI Conseil */}
              {suggestedSkills.conseil && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">Notre conseil</p>
                  <p className="text-sm text-blue-800">{suggestedSkills.conseil}</p>
                </div>
              )}

              {/* Technical skills suggestions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Compétences techniques suggérées</p>
                <p className="text-xs text-gray-400 mb-3">Clique pour ajouter ou retirer</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.skills?.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => toggleSkill(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        skills.includes(s)
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {skills.includes(s) ? '✓ ' : '+ '}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending skills */}
              {suggestedSkills.skills_tendance?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Compétences en demande 🔥</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.skills_tendance.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => toggleSkill(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          skills.includes(s)
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        {skills.includes(s) ? '✓ ' : '+ '}{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft skills suggestions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Qualités personnelles suggérées</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.soft_skills?.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => toggleSoftSkill(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        softSkills.includes(s)
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {softSkills.includes(s) ? '✓ ' : '+ '}{s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Custom skill input */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Ajouter une compétence technique</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                  placeholder="Ex: Docker"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addCustomSkill} className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-200">
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Ajouter un soft skill</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSoftSkill}
                  onChange={e => setNewSoftSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSoftSkill())}
                  placeholder="Ex: Leadership"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={addCustomSoftSkill} className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-purple-200">
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Selected skills summary */}
          {(skills.length > 0 || softSkills.length > 0) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Sélectionnées ({skills.length + softSkills.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span key={`s-${i}`} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => toggleSkill(s)} className="hover:text-red-600 cursor-pointer">×</button>
                  </span>
                ))}
                {softSkills.map((s, i) => (
                  <span key={`ss-${i}`} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {s}
                    <button onClick={() => toggleSoftSkill(s)} className="hover:text-red-600 cursor-pointer">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              &larr; Retour
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={skills.length === 0}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Choisir un modèle &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Template selection + Download */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-900">Choisis un modèle de CV</h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  selectedTemplate === t.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full h-32 rounded-lg mb-3 flex items-center justify-center ${
                  t.id === 'classique' ? 'bg-blue-100' : t.id === 'moderne' ? 'bg-indigo-100' : 'bg-gray-100'
                }`}>
                  <div className={`w-16 h-20 rounded shadow-sm ${
                    t.id === 'classique' ? 'bg-white border-t-4 border-blue-500' :
                    t.id === 'moderne' ? 'bg-white flex' :
                    'bg-white border border-gray-200'
                  }`}>
                    {t.id === 'moderne' && (
                      <div className="w-5 h-full bg-indigo-800 rounded-l" />
                    )}
                  </div>
                </div>
                <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>

          {/* CV Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">Résumé de ton CV</p>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><span className="text-gray-500">Nom :</span> <span className="font-medium">{personalInfo.first_name} {personalInfo.last_name}</span></div>
              <div><span className="text-gray-500">Ville :</span> <span className="font-medium">{personalInfo.city || '—'}</span></div>
              <div><span className="text-gray-500">Formations :</span> <span className="font-medium">{formations.filter(f => f.diplome).length}</span></div>
              <div><span className="text-gray-500">Expériences :</span> <span className="font-medium">{experiences.filter(e => e.poste).length}</span></div>
              <div><span className="text-gray-500">Compétences :</span> <span className="font-medium">{skills.length}</span></div>
              <div><span className="text-gray-500">Qualités personnelles :</span> <span className="font-medium">{softSkills.length}</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              &larr; Retour
            </button>

            <div className="flex-1" />

            {/* Download PDF */}
            {TemplateComponent && (
              <PDFDownloadLink
                document={<TemplateComponent data={getCvData()} />}
                fileName={`CV_${personalInfo.first_name}_${personalInfo.last_name}.pdf`}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-900 transition-all cursor-pointer text-center inline-flex items-center justify-center gap-2"
              >
                {({ loading: pdfLoading }) =>
                  pdfLoading ? 'Préparation...' : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Télécharger le PDF
                    </>
                  )
                }
              </PDFDownloadLink>
            )}

            {/* Save & continue */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sauvegarde...
                </>
              ) : 'Sauvegarder et continuer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
