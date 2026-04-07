import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const STEPS = [
  { id: 1, label: 'Préférences', description: 'Que recherchez-vous ?' },
  { id: 2, label: 'CV', description: 'Soumettez votre CV' },
  { id: 3, label: 'Profil', description: 'Votre profil extrait' },
];

export default function ProfilPage() {
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [cvUploaded, setCvUploaded] = useState(false);
  const [cvUploadedAt, setCvUploadedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [prefForm, setPrefForm] = useState({
    sector: '',
    contract_type: '',
    location: '',
    keywords: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get('/profile');
      setProfile(res.data.profile);
      setPreferences(res.data.preferences);
      setCvUploaded(res.data.cvUploaded);
      setCvUploadedAt(res.data.cvUploadedAt);

      if (res.data.preferences) {
        setPrefForm({
          sector: res.data.preferences.sector || '',
          contract_type: res.data.preferences.contract_type || '',
          location: res.data.preferences.location || '',
          keywords: (res.data.preferences.keywords || []).join(', '),
        });
      }

      // Auto-select step based on completion
      if (res.data.preferences?.sector && res.data.cvUploaded && res.data.profile) {
        setCurrentStep(3);
      } else if (res.data.preferences?.sector) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoading(false);
    }
  };

  // Completeness score
  const completeness = (() => {
    let score = 0;
    let total = 5;
    if (prefForm.sector) score++;
    if (prefForm.contract_type) score++;
    if (prefForm.location) score++;
    if (cvUploaded) score++;
    if (profile?.skills?.length > 0) score++;
    return { score, total, percent: Math.round((score / total) * 100) };
  })();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 5 Mo.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('cv', file);

    try {
      const res = await api.post('/profile/cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile({
        ...profile,
        first_name: res.data.profile.first_name,
        last_name: res.data.profile.last_name,
        phone: res.data.profile.phone,
        city: res.data.profile.city,
        skills: res.data.profile.skills,
        soft_skills: res.data.profile.soft_skills,
        formations: res.data.profile.formations,
        experiences: res.data.profile.experiences,
      });
      setCvUploaded(true);
      setCvUploadedAt(new Date().toISOString());
      setSuccess('CV analysé avec succès !');
      setCurrentStep(3);
    } catch (err) {
      const message = err.response?.data?.error || "Erreur lors de l'upload du CV.";
      setError(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setError('');
    setSuccess('');

    const keywordsArray = prefForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    try {
      const res = await api.post('/profile/preferences', {
        sector: prefForm.sector,
        contract_type: prefForm.contract_type,
        location: prefForm.location,
        keywords: keywordsArray,
      });
      setPreferences(res.data.preferences);
      setSuccess('Préférences sauvegardées !');
      // Auto-advance to step 2
      setTimeout(() => {
        setCurrentStep(2);
        setSuccess('');
      }, 800);
    } catch (err) {
      const message = err.response?.data?.error || 'Erreur lors de la sauvegarde.';
      setError(message);
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header + Score de complétude */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Complète ton profil étape par étape pour personnaliser ta recherche.
            </p>
          </div>
          {/* Completeness badge */}
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 shrink-0">
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={completeness.percent === 100 ? '#22c55e' : '#3b82f6'}
                  strokeWidth="3"
                  strokeDasharray={`${completeness.percent}, 100`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                {completeness.percent}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {completeness.percent === 100 ? 'Profil complet !' : 'Complétude'}
              </p>
              <p className="text-xs text-gray-400">{completeness.score}/{completeness.total} éléments</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => setCurrentStep(step.id)}
                className="flex items-center gap-3 cursor-pointer group w-full"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : step.id < currentStep || (step.id === 1 && preferences?.sector) || (step.id === 2 && cvUploaded)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                  }`}
                >
                  {(step.id < currentStep || (step.id === 1 && preferences?.sector) || (step.id === 2 && cvUploaded)) && currentStep !== step.id ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className={`text-sm font-medium ${currentStep === step.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 rounded transition-all duration-300 ${
                  step.id < currentStep || (step.id === 1 && preferences?.sector)
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* ========= STEP 1 : Préférences ========= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Que recherchez-vous ?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Dis-nous ce que tu cherches pour qu'on puisse cibler les meilleures opportunités.
            </p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-5">
            {/* Secteur */}
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1.5">
                Domaine / Secteur d'activité
              </label>
              <input
                id="sector"
                type="text"
                value={prefForm.sector}
                onChange={(e) => setPrefForm({ ...prefForm, sector: e.target.value })}
                placeholder="Ex: Business Analyst, Développeur Web, Marketing Digital..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Type de contrat */}
              <div>
                <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type de contrat
                </label>
                <select
                  id="contract_type"
                  value={prefForm.contract_type}
                  onChange={(e) => setPrefForm({ ...prefForm, contract_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="alternance">Alternance</option>
                  <option value="stage">Stage</option>
                  <option value="alternance_ou_stage">Alternance ou Stage</option>
                </select>
              </div>

              {/* Localisation */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Localisation souhaitée
                </label>
                <input
                  id="location"
                  type="text"
                  value={prefForm.location}
                  onChange={(e) => setPrefForm({ ...prefForm, location: e.target.value })}
                  placeholder="Ex: Paris, Lyon, Remote..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mots-clés */}
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mots-clés / Compétences recherchées
              </label>
              <input
                id="keywords"
                type="text"
                value={prefForm.keywords}
                onChange={(e) => setPrefForm({ ...prefForm, keywords: e.target.value })}
                placeholder="Ex: React, Python, Excel, Gestion de projet (séparés par des virgules)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1.5">Sépare chaque mot-clé par une virgule</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingPrefs}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              >
                {savingPrefs ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sauvegarde...
                  </span>
                ) : 'Sauvegarder et continuer'}
              </button>
              {preferences?.sector && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Passer au CV &rarr;
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========= STEP 2 : Upload CV ========= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 animate-fadeIn">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Soumettez votre CV</h2>
            <p className="text-sm text-gray-500 mt-1">
              Notre IA va analyser ton CV et extraire automatiquement tes compétences, formations et expériences.
            </p>
          </div>

          {/* Preferences summary */}
          {preferences?.sector && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-medium text-blue-600 mb-1.5">Recherche configurée pour :</p>
              <div className="flex flex-wrap gap-2">
                {preferences.sector && (
                  <span className="bg-white text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-200">{preferences.sector}</span>
                )}
                {preferences.contract_type && (
                  <span className="bg-white text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-200">{preferences.contract_type}</span>
                )}
                {preferences.location && (
                  <span className="bg-white text-blue-700 text-xs px-2.5 py-1 rounded-lg border border-blue-200">{preferences.location}</span>
                )}
              </div>
            </div>
          )}

          {cvUploaded && (
            <div className="mb-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              CV uploadé le {new Date(cvUploadedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </div>
          )}

          <label
            htmlFor="cv-upload"
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer block transition-all duration-300 ${
              uploading
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-600 font-semibold">Analyse en cours...</p>
                <p className="text-xs text-gray-400">L'IA extrait les informations de ton CV, cela peut prendre quelques secondes</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {cvUploaded ? 'Remplacer mon CV' : 'Clique ou glisse ton CV ici'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF uniquement, 5 Mo max</p>
                </div>
              </div>
            )}
          </label>
          <input
            ref={fileInputRef}
            id="cv-upload"
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              &larr; Retour aux préférences
            </button>
            {cvUploaded && profile && (
              <button
                onClick={() => setCurrentStep(3)}
                className="ml-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-all cursor-pointer shadow-sm"
              >
                Voir mon profil &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========= STEP 3 : Profil extrait ========= */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          {!profile ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Aucun profil extrait. Upload ton CV pour commencer.
              </p>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                &larr; Aller à l'upload CV
              </button>
            </div>
          ) : (
            <>
              {/* Identity card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {profile.city && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {profile.city}
                        </span>
                      )}
                      {profile.phone && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          {profile.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    Modifier CV
                  </button>
                </div>
              </div>

              {/* Skills grid */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Compétences techniques */}
                {profile.skills?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </span>
                      Compétences techniques
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soft skills */}
                {profile.soft_skills?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                        </svg>
                      </span>
                      Soft skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.soft_skills.map((skill, i) => (
                        <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Formations */}
              {profile.formations?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                      </svg>
                    </span>
                    Formations
                  </h3>
                  <div className="space-y-2">
                    {(typeof profile.formations === 'string'
                      ? JSON.parse(profile.formations)
                      : profile.formations
                    ).map((f, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{f.diplome}</p>
                        <p className="text-xs text-gray-500">
                          {f.etablissement} {f.annee && `— ${f.annee}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expériences */}
              {profile.experiences?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </span>
                    Expériences
                  </h3>
                  <div className="space-y-2">
                    {(typeof profile.experiences === 'string'
                      ? JSON.parse(profile.experiences)
                      : profile.experiences
                    ).map((e, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">{e.poste}</p>
                        <p className="text-xs text-gray-500">
                          {e.entreprise} {e.periode && `— ${e.periode}`}
                        </p>
                        {e.description && (
                          <p className="text-xs text-gray-400 mt-1">{e.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA: go to search */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Profil complet !</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Passe directement à la recherche d'entreprises et d'offres.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/recherche')}
                  className="bg-white text-blue-700 px-6 py-3 rounded-xl font-medium text-sm hover:bg-blue-50 transition-colors cursor-pointer shadow-sm shrink-0"
                >
                  Lancer une recherche &rarr;
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
