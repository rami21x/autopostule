import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ---- Utility components ----

function ScoreBadge({ score }) {
  let color = 'bg-red-100 text-red-700 ring-red-200';
  if (score >= 80) color = 'bg-green-100 text-green-700 ring-green-200';
  else if (score >= 60) color = 'bg-yellow-100 text-yellow-700 ring-yellow-200';
  else if (score >= 40) color = 'bg-orange-100 text-orange-700 ring-orange-200';

  return (
    <span className={`${color} ring-1 text-xs font-bold px-2.5 py-1 rounded-full`}>
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

function AxeBadge({ axe }) {
  const config = {
    exact: { label: 'Correspond exactement', color: 'bg-green-100 text-green-700' },
    connexe: { label: 'Domaine proche', color: 'bg-blue-100 text-blue-700' },
    profil: { label: 'Adapté à ton profil', color: 'bg-purple-100 text-purple-700' },
  };
  const c = config[axe] || config.exact;
  return <span className={`${c.color} text-[10px] font-medium px-2 py-0.5 rounded-full`}>{c.label}</span>;
}

function EntrepriseCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
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

      <div className="mb-2">
        <AxeBadge axe={item.axe} />
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

      <ScoreBar score={item.score} />

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-medium">{item.taille}</span>
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
      <div className="flex items-start justify-between mb-2">
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

      <div className="mb-2">
        <AxeBadge axe={item.axe} />
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

      <ScoreBar score={item.score} />

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-lg font-medium">{item.type_contrat}</span>
        {(item.competences_requises || []).slice(0, 3).map((comp, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{comp}</span>
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

function AxeSection({ title, description, icon, items, type, onSelect }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) =>
          type === 'entreprise' ? (
            <EntrepriseCard key={`${item.nom}-${i}`} item={item} onClick={() => onSelect(item, 'entreprise')} />
          ) : (
            <OffreCard key={`${item.titre}-${i}`} item={item} onClick={() => onSelect(item, 'offre')} />
          )
        )}
      </div>
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

// ---- Helpers ----

function flattenAxes(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data; // backward compat
  return [...(data.exact || []), ...(data.connexe || []), ...(data.profil || [])];
}

function mergeAxes(existing, newData) {
  if (!existing || !newData) return newData || existing || { exact: [], connexe: [], profil: [] };
  return {
    exact: [...(existing.exact || []), ...(newData.exact || [])],
    connexe: [...(existing.connexe || []), ...(newData.connexe || [])],
    profil: [...(existing.profil || []), ...(newData.profil || [])],
  };
}

function loadSavedResults() {
  try {
    const saved = sessionStorage.getItem('searchResults');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

// ---- Main component ----

export default function RecherchePage() {
  const saved = loadSavedResults();
  const [entreprises, setEntreprises] = useState(saved?.entreprises || null);
  const [offres, setOffres] = useState(saved?.offres || null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(!!saved);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('entreprises');
  const [activeAxe, setActiveAxe] = useState('all');
  const navigate = useNavigate();

  const allEntreprises = flattenAxes(entreprises);
  const allOffres = flattenAxes(offres);

  const handleSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/search/launch');
      setEntreprises(res.data.entreprises);
      setOffres(res.data.offres);
      setSearched(true);
      sessionStorage.setItem('searchResults', JSON.stringify({
        entreprises: res.data.entreprises,
        offres: res.data.offres,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    setError('');

    const existingNames = [
      ...allEntreprises.map(e => e.nom),
      ...allOffres.map(o => `${o.titre} chez ${o.entreprise}`),
    ];

    try {
      const res = await api.post('/search/more', { existingNames });
      const newEntreprises = mergeAxes(entreprises, res.data.entreprises);
      const newOffres = mergeAxes(offres, res.data.offres);
      setEntreprises(newEntreprises);
      setOffres(newOffres);
      sessionStorage.setItem('searchResults', JSON.stringify({
        entreprises: newEntreprises,
        offres: newOffres,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement.');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSelectTarget = (target, type) => {
    sessionStorage.setItem('selectedTarget', JSON.stringify({ ...target, type }));
    navigate('/analyse');
  };

  const getFilteredItems = (data, axe) => {
    if (!data) return [];
    if (Array.isArray(data)) return data; // backward compat
    if (axe === 'all') return flattenAxes(data);
    return data[axe] || [];
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Recherche intelligente</h1>
        <p className="text-gray-500 mt-1 text-sm">
          On analyse ton profil et tes préférences pour trouver les meilleures opportunités.
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
                ? `${allEntreprises.length} entreprises et ${allOffres.length} offres identifiées`
                : 'Clique pour chercher des entreprises et offres adaptées à ton profil'
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
            <p className="text-sm text-blue-600">Recherche des meilleures opportunités pour toi... Quelques secondes.</p>
          </div>
        )}
      </div>

      {/* Results */}
      {searched && !loading && (
        <div className="animate-fadeIn">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Entreprises" value={allEntreprises.length} color="blue" />
            <StatCard label="Offres" value={allOffres.length} color="purple" />
            <StatCard
              label="Score moyen"
              value={`${Math.round(([...allEntreprises, ...allOffres].reduce((s, e) => s + (e.score || 0), 0) / Math.max([...allEntreprises, ...allOffres].length, 1)))}%`}
              color="green"
            />
            <StatCard label="Total" value={allEntreprises.length + allOffres.length} color="gray" />
          </div>

          {/* Main tabs: Entreprises / Offres */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => { setActiveTab('entreprises'); setActiveAxe('all'); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'entreprises' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Candidature spontanée ({allEntreprises.length})
            </button>
            <button
              onClick={() => { setActiveTab('offres'); setActiveAxe('all'); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === 'offres' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Offres existantes ({allOffres.length})
            </button>
          </div>

          {/* Axe filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'all', label: 'Tous', icon: '' },
              { id: 'exact', label: 'Correspond exactement', icon: '🎯' },
              { id: 'connexe', label: 'Domaine connexe', icon: '🔗' },
              { id: 'profil', label: 'Basé sur le profil', icon: '👤' },
            ].map(a => (
              <button
                key={a.id}
                onClick={() => setActiveAxe(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeAxe === a.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {/* Entreprises tab */}
          {activeTab === 'entreprises' && (
            <div>
              {activeAxe === 'all' ? (
                <>
                  <AxeSection
                    title="Correspond exactement à tes préférences"
                    description="Même secteur, même type de poste, même localisation"
                    icon="🎯"
                    items={entreprises?.exact}
                    type="entreprise"
                    onSelect={handleSelectTarget}
                  />
                  <AxeSection
                    title="Domaine connexe"
                    description="Même domaine large, compétences transférables, ville proche"
                    icon="🔗"
                    items={entreprises?.connexe}
                    type="entreprise"
                    onSelect={handleSelectTarget}
                  />
                  <AxeSection
                    title="Adapté à ton profil"
                    description="Correspond à tes compétences et expériences, indépendamment des préférences"
                    icon="👤"
                    items={entreprises?.profil}
                    type="entreprise"
                    onSelect={handleSelectTarget}
                  />
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getFilteredItems(entreprises, activeAxe).map((e, i) => (
                    <EntrepriseCard key={`${e.nom}-${i}`} item={e} onClick={() => handleSelectTarget(e, 'entreprise')} />
                  ))}
                </div>
              )}
              {getFilteredItems(entreprises, activeAxe).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune entreprise trouvée dans cette catégorie.</div>
              )}
            </div>
          )}

          {/* Offres tab */}
          {activeTab === 'offres' && (
            <div>
              {activeAxe === 'all' ? (
                <>
                  <AxeSection
                    title="Correspond exactement à tes préférences"
                    description="Poste recherché, bon secteur, bonne localisation"
                    icon="🎯"
                    items={offres?.exact}
                    type="offre"
                    onSelect={handleSelectTarget}
                  />
                  <AxeSection
                    title="Domaine connexe"
                    description="Même domaine large, poste différent mais compétences transférables"
                    icon="🔗"
                    items={offres?.connexe}
                    type="offre"
                    onSelect={handleSelectTarget}
                  />
                  <AxeSection
                    title="Adapté à ton profil"
                    description="Correspond à tes compétences, peut être dans un autre secteur ou ville"
                    icon="👤"
                    items={offres?.profil}
                    type="offre"
                    onSelect={handleSelectTarget}
                  />
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getFilteredItems(offres, activeAxe).map((o, i) => (
                    <OffreCard key={`${o.titre}-${i}`} item={o} onClick={() => handleSelectTarget(o, 'offre')} />
                  ))}
                </div>
              )}
              {getFilteredItems(offres, activeAxe).length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Aucune offre trouvée dans cette catégorie.</div>
              )}
            </div>
          )}

          {/* Load more button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              {loadingMore ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Chargement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Afficher plus de résultats
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2">De nouvelles suggestions à chaque clic</p>
          </div>
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
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Assure-toi d'avoir partagé ton CV et rempli tes préférences dans la page Profil, puis lance la recherche.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
            <div className="bg-green-50 rounded-xl px-4 py-3 text-green-700">
              <span className="font-medium">🎯 Axe 1</span> — Correspond exactement à tes préférences
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-blue-700">
              <span className="font-medium">🔗 Axe 2</span> — Domaine connexe, compétences transférables
            </div>
            <div className="bg-purple-50 rounded-xl px-4 py-3 text-purple-700">
              <span className="font-medium">👤 Axe 3</span> — Basé sur ton profil uniquement
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
