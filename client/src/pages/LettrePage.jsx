import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LettrePage() {
  const [target, setTarget] = useState(null);
  const [analyse, setAnalyse] = useState(null);
  const [lettre, setLettre] = useState(null);
  const [contenu, setContenu] = useState('');
  const [objet, setObjet] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Charger la cible et l'analyse depuis sessionStorage
    const savedTarget = sessionStorage.getItem('selectedTarget');
    const savedAnalyse = sessionStorage.getItem('analyseForLettre');

    if (savedTarget) {
      try {
        setTarget(JSON.parse(savedTarget));
      } catch {}
    }
    if (savedAnalyse) {
      try {
        setAnalyse(JSON.parse(savedAnalyse));
      } catch {}
    }

    // Charger une lettre deja generee
    const savedLettre = sessionStorage.getItem('generatedLettre');
    if (savedLettre) {
      try {
        const parsed = JSON.parse(savedLettre);
        setLettre(parsed);
        setContenu(parsed.contenu || '');
        setObjet(parsed.objet || '');
      } catch {}
    }
  }, []);

  const handleGenerate = async () => {
    if (!target) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setSaved(false);

    try {
      const res = await api.post('/lettre/generate', { target, analyse });
      const result = res.data.lettre;
      setLettre(result);
      setContenu(result.contenu || '');
      setObjet(result.objet || '');
      sessionStorage.setItem('generatedLettre', JSON.stringify(result));
    } catch (err) {
      const message = err.response?.data?.error || 'Erreur lors de la generation.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contenu.trim()) {
      setError('La lettre est vide.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/lettre/save', {
        target,
        content: contenu,
        objet,
      });
      setSaved(true);
      setSuccess('Lettre sauvegardee et candidature creee ! Va sur l\'onglet Suivi pour voir tes candidatures.');
    } catch (err) {
      const message = err.response?.data?.error || 'Erreur lors de la sauvegarde.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const fullText = objet ? `Objet : ${objet}\n\n${contenu}` : contenu;
    navigator.clipboard.writeText(fullText).then(() => {
      setSuccess('Lettre copiee dans le presse-papier !');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const wordCount = contenu.trim() ? contenu.trim().split(/\s+/).length : 0;

  if (!target) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lettre de motivation</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-12">
          <div className="text-4xl mb-4">&#9997;&#65039;</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune cible selectionnee</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Selectionne une entreprise sur la page Recherche, lance l'analyse, puis reviens ici pour generer ta lettre.
          </p>
          <button
            onClick={() => navigate('/recherche')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Aller a la recherche
          </button>
        </div>
      </div>
    );
  }

  const targetName = target.nom || target.titre;
  const targetCompany = target.type === 'offre' ? target.entreprise : target.nom;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lettre de motivation</h1>
        <p className="text-gray-500 mt-1">
          Lettre personnalisee pour {targetCompany}
        </p>
      </div>

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

      {/* Info cible */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              {target.type === 'entreprise' ? 'Candidature spontanee' : 'Reponse a une offre'}
            </p>
            <p className="font-semibold text-gray-900">{targetName}</p>
            <p className="text-sm text-gray-500">
              {target.type === 'entreprise'
                ? `${target.secteur} — ${target.ville}`
                : `${target.entreprise} — ${target.ville}`}
            </p>
          </div>
          {!lettre && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generation...
                </>
              ) : (
                'Generer la lettre'
              )}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Le LLM redige une lettre personnalisee pour {targetCompany}...</p>
          <p className="text-gray-400 text-xs mt-1">Cela peut prendre quelques secondes</p>
        </div>
      )}

      {/* Lettre generee */}
      {lettre && !loading && (
        <div className="space-y-6">
          {/* Objet */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <label htmlFor="objet" className="block text-sm font-medium text-gray-700 mb-2">
              Objet de la candidature
            </label>
            <input
              id="objet"
              type="text"
              value={objet}
              onChange={(e) => { setObjet(e.target.value); setSaved(false); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contenu editable */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="contenu" className="block text-sm font-medium text-gray-700">
                Contenu de la lettre
              </label>
              <span className="text-xs text-gray-400">{wordCount} mots</span>
            </div>
            <textarea
              id="contenu"
              value={contenu}
              onChange={(e) => { setContenu(e.target.value); setSaved(false); }}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tu peux modifier librement le texte avant de sauvegarder.
            </p>
          </div>

          {/* Points cles utilises */}
          {lettre.points_cles_utilises?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Points cles utilises dans la lettre</h3>
              <div className="flex flex-wrap gap-1.5">
                {lettre.points_cles_utilises.map((point, i) => (
                  <span key={i} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                    {point}
                  </span>
                ))}
              </div>
              {lettre.ton && (
                <p className="text-xs text-gray-400 mt-3">Ton adopte : {lettre.ton}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 justify-center py-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Regenerer
            </button>
            <button
              onClick={handleCopy}
              className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Copier
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed ${
                saved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {saving ? 'Sauvegarde...' : saved ? 'Sauvegardee !' : 'Sauvegarder et creer la candidature'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
