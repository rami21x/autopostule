import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ScoreBadge({ score }) {
  let color = 'bg-red-100 text-red-700';
  let ring = 'ring-red-200';
  if (score >= 80) { color = 'bg-green-100 text-green-700'; ring = 'ring-green-200'; }
  else if (score >= 60) { color = 'bg-yellow-100 text-yellow-700'; ring = 'ring-yellow-200'; }
  else if (score >= 40) { color = 'bg-orange-100 text-orange-700'; ring = 'ring-orange-200'; }

  return (
    <span className={`${color} ring-1 ${ring} text-xs font-bold px-2.5 py-1 rounded-full`}>
      {score}%
    </span>
  );
}

function ScoreBar({ score }) {
  let color = 'bg-red-500';
  if (score >= 80) color = 'bg-green-500';
  else if (score >= 60) color = 'bg-yellow-500';
  else if (score >= 40) color = 'bg-orange-500';

  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
    </div>
  );
}

function EntrepriseCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
            {item.nom?.[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{item.nom}</h3>
            <p className="text-xs text-gray-500">{item.secteur} — {item.ville}</p>
          </div>
        </div>
        <ScoreBadge score={item.score} />
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

      <ScoreBar score={item.score} />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-medium">
          {item.taille}
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
          {item.contact_cible}
        </span>
      </div>

      <p className="text-xs text-green-600 mt-3 italic flex items-start gap-1.5">
        <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {item.pourquoi_postuler}
      </p>

      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
        <span className="text-xs text-blue-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Analyser la correspondance
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function OffreCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
            {item.entreprise?.[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{item.titre}</h3>
            <p className="text-xs text-gray-500">{item.entreprise} — {item.ville}</p>
          </div>
        </div>
        <ScoreBadge score={item.score} />
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

      <ScoreBar score={item.score} />

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg font-medium">
          {item.type_contrat}
        </span>
        {(item.competences_requises || []).slice(0, 3).map((comp, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
            {comp}
          </span>
        ))}
        {(item.competences_requises || []).length > 3 && (
          <span className="text-xs text-gray-400">+{item.competences_requises.length - 3}</span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
        <span className="text-xs text-purple-600 font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          Voir l'analyse
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function loadSavedResults() {
  try {
    const saved = sessionStorage.getItem('searchResults');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

export default function RecherchePage() {
  const saved = loadSavedResults();
  const [entreprises, setEntreprises] = useState(saved?.entreprises || []);
  const [offres, setOffres] = useState(saved?.offres || []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!saved);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('entreprises');
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/search/launch');
      const newEntreprises = res.data.entreprises || [];
      const newOffres = res.data.offres || [];
      setEntreprises(newEntreprises);
      setOffres(newOffres);
      setSearched(true);
      sessionStorage.setItem('searchResults', JSON.stringify({
        entreprises: newEntreprises,
        offres: newOffres,
      }));
    } catch (err) {
      const message = err.response?.data?.error || 'Erreur lors de la recherche.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTarget = (target, type) => {
    sessionStorage.setItem('selectedTarget', JSON.stringify({ ...target, type }));
    navigate('/analyse');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recherche intelligente</h1>
        <p className="text-gray-500 mt-1 text-sm">
          L'IA analyse ton profil et tes préférences pour trouver les meilleures opportunités.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Search button */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-semibold text-gray-800">
              {searched ? 'Résultats trouvés' : 'Prêt à chercher'}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {searched
                ? `${entreprises.length} entreprises et ${offres.length} offres identifiées`
                : 'Clique pour lancer l\'analyse IA de ton profil'
              }
            </p>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Recherche en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                {searched ? 'Relancer la recherche' : 'Lancer la recherche'}
              </>
            )}
          </button>
        </div>
        {loading && (
          <div className="mt-4 bg-blue-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" />
            <p className="text-sm text-blue-600">L'IA analyse ton profil et identifie des cibles pertinentes... Cela peut prendre quelques secondes.</p>
          </div>
        )}
      </div>

      {/* Results */}
      {searched && !loading && (
        <div className="animate-fadeIn">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Entreprises" value={entreprises.length} color="blue" />
            <StatCard label="Offres" value={offres.length} color="purple" />
            <StatCard
              label="Score moyen"
              value={`${Math.round(([...entreprises, ...offres].reduce((s, e) => s + (e.score || 0), 0) / Math.max([...entreprises, ...offres].length, 1)))}%`}
              color="green"
            />
            <StatCard label="Total" value={entreprises.length + offres.length} color="gray" />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('entreprises')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'entreprises'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entreprises ({entreprises.length})
            </button>
            <button
              onClick={() => setActiveTab('offres')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'offres'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Offres ({offres.length})
            </button>
          </div>

          {/* Entreprises tab */}
          {activeTab === 'entreprises' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Entreprises qui pourraient recruter, même sans offre publiée. Clique sur une carte pour analyser la correspondance.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {entreprises.map((e, i) => (
                  <EntrepriseCard
                    key={i}
                    item={e}
                    onClick={() => handleSelectTarget(e, 'entreprise')}
                  />
                ))}
              </div>
              {entreprises.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune entreprise trouvée.</div>
              )}
            </div>
          )}

          {/* Offres tab */}
          {activeTab === 'offres' && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Offres d'alternance ou stage qui correspondent à ton profil. Clique sur une carte pour voir l'analyse détaillée.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {offres.map((o, i) => (
                  <OffreCard
                    key={i}
                    item={o}
                    onClick={() => handleSelectTarget(o, 'offre')}
                  />
                ))}
              </div>
              {offres.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune offre trouvée.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Prêt à chercher</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Assure-toi d'avoir uploadé ton CV et rempli tes préférences dans la page Profil,
            puis clique sur "Lancer la recherche" pour découvrir des entreprises et offres ciblées.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700',
  };

  return (
    <div className={`${colors[color]} rounded-xl px-4 py-3 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}
