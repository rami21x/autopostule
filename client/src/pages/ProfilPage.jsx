import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

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
  const fileInputRef = useRef(null);

  // Formulaire preferences
  const [prefForm, setPrefForm] = useState({
    sector: '',
    contract_type: '',
    location: '',
    keywords: '',
  });

  // Charger le profil au montage
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

      // Pre-remplir le formulaire preferences si existant
      if (res.data.preferences) {
        setPrefForm({
          sector: res.data.preferences.sector || '',
          contract_type: res.data.preferences.contract_type || '',
          location: res.data.preferences.location || '',
          keywords: (res.data.preferences.keywords || []).join(', '),
        });
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptes.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier ne doit pas depasser 5 Mo.');
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
      setSuccess('CV analyse avec succes !');
    } catch (err) {
      const message = err.response?.data?.error || 'Erreur lors de l\'upload du CV.';
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
      setSuccess('Preferences sauvegardees !');
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-500 mt-1">
          Upload ton CV et renseigne tes preferences pour personnaliser ta recherche.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload CV */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">CV (PDF)</h2>

          {cvUploaded && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3">
              CV uploade le {new Date(cvUploadedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </div>
          )}

          <label
            htmlFor="cv-upload"
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer block transition-colors ${
              uploading
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-600 font-medium">Analyse en cours...</p>
                <p className="text-xs text-gray-400">Le LLM extrait les informations de ton CV</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">&#128196;</div>
                <p className="text-sm font-medium text-gray-700">
                  {cvUploaded ? 'Remplacer mon CV' : 'Clique pour uploader ton CV'}
                </p>
                <p className="text-xs text-gray-400">PDF uniquement, 5 Mo max</p>
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
        </div>

        {/* Profil extrait */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Profil extrait</h2>

          {!profile ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">
                Upload ton CV pour voir tes informations extraites ici.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Identite */}
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Identite</p>
                <p className="text-gray-900">
                  {profile.first_name} {profile.last_name}
                </p>
                {profile.city && <p className="text-sm text-gray-500">{profile.city}</p>}
                {profile.phone && <p className="text-sm text-gray-500">{profile.phone}</p>}
              </div>

              {/* Competences techniques */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Competences techniques</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft skills */}
              {profile.soft_skills && profile.soft_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Soft skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.soft_skills.map((skill, i) => (
                      <span
                        key={i}
                        className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Formations */}
              {profile.formations && profile.formations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Formations</p>
                  <div className="space-y-2">
                    {(typeof profile.formations === 'string'
                      ? JSON.parse(profile.formations)
                      : profile.formations
                    ).map((f, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-sm font-medium text-gray-800">{f.diplome}</p>
                        <p className="text-xs text-gray-500">
                          {f.etablissement} {f.annee && `— ${f.annee}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experiences */}
              {profile.experiences && profile.experiences.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Experiences</p>
                  <div className="space-y-2">
                    {(typeof profile.experiences === 'string'
                      ? JSON.parse(profile.experiences)
                      : profile.experiences
                    ).map((e, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
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
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Preferences de recherche</h2>

          <form onSubmit={handleSavePreferences} className="grid gap-4 sm:grid-cols-2">
            {/* Secteur */}
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
                Secteur d'activite
              </label>
              <input
                id="sector"
                type="text"
                value={prefForm.sector}
                onChange={(e) => setPrefForm({ ...prefForm, sector: e.target.value })}
                placeholder="Ex: Informatique, Finance, Marketing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type de contrat */}
            <div>
              <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1">
                Type de contrat
              </label>
              <select
                id="contract_type"
                value={prefForm.contract_type}
                onChange={(e) => setPrefForm({ ...prefForm, contract_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Selectionner...</option>
                <option value="alternance">Alternance</option>
                <option value="stage">Stage</option>
                <option value="alternance_ou_stage">Alternance ou Stage</option>
              </select>
            </div>

            {/* Localisation */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Localisation souhaitee
              </label>
              <input
                id="location"
                type="text"
                value={prefForm.location}
                onChange={(e) => setPrefForm({ ...prefForm, location: e.target.value })}
                placeholder="Ex: Paris, Lyon, Remote..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mots-cles */}
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                Mots-cles
              </label>
              <input
                id="keywords"
                type="text"
                value={prefForm.keywords}
                onChange={(e) => setPrefForm({ ...prefForm, keywords: e.target.value })}
                placeholder="Ex: React, Python, DevOps (separes par des virgules)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Separe chaque mot-cle par une virgule</p>
            </div>

            {/* Bouton */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingPrefs}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPrefs ? 'Sauvegarde...' : 'Sauvegarder mes preferences'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
