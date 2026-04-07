import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ScoreCircle({ value, size = 'lg' }) {
  const dims = size === 'lg' ? 'w-28 h-28' : 'w-16 h-16';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-lg';
  const strokeW = size === 'lg' ? 4 : 3;
  let color = '#ef4444';
  if (value >= 80) color = '#22c55e';
  else if (value >= 60) color = '#eab308';
  else if (value >= 40) color = '#f97316';

  return (
    <div className={`relative ${dims}`}>
      <svg className={`${dims} -rotate-90`} viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#e5e7eb" strokeWidth={strokeW}
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={`${value}, 100`}
          className="transition-all duration-700"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center ${textSize} font-bold text-gray-800`}>
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, value, icon }) {
  let color = 'bg-red-500';
  let bgColor = 'bg-red-50';
  if (value >= 80) { color = 'bg-green-500'; bgColor = 'bg-green-50'; }
  else if (value >= 60) { color = 'bg-yellow-500'; bgColor = 'bg-yellow-50'; }
  else if (value >= 40) { color = 'bg-orange-500'; bgColor = 'bg-orange-50'; }

  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <span>{icon}</span> {label}
        </span>
        <span className="text-sm font-bold text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-white/80 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function PrioriteBadge({ priorite }) {
  const config = {
    haute: { color: 'bg-red-100 text-red-700', icon: '!!', label: 'Haute' },
    moyenne: { color: 'bg-yellow-100 text-yellow-700', icon: '!', label: 'Moyenne' },
    basse: { color: 'bg-gray-100 text-gray-600', icon: '~', label: 'Basse' },
  };
  const c = config[priorite] || config.basse;
  return (
    <span className={`${c.color} text-xs font-medium px-2 py-0.5 rounded-full`}>
      {c.label}
    </span>
  );
}

function SuggestionCard({ suggestion, color }) {
  return (
    <div className={`border-l-4 ${color} bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
          {suggestion.categorie}
        </span>
        <PrioriteBadge priorite={suggestion.priorite} />
      </div>
      <h4 className="font-semibold text-gray-900 text-sm mb-1">{suggestion.titre}</h4>
      <p className="text-sm text-gray-600 leading-relaxed">{suggestion.description}</p>
    </div>
  );
}

export default function AnalysePage() {
  const [target, setTarget] = useState(null);
  const [analyse, setAnalyse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('selectedTarget');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTarget(parsed);

        const savedAnalyse = sessionStorage.getItem('analyseResult');
        if (savedAnalyse) {
          const parsedAnalyse = JSON.parse(savedAnalyse);
          const targetKey = parsed.nom || parsed.titre;
          if (parsedAnalyse._targetKey === targetKey) {
            setAnalyse(parsedAnalyse);
            return;
          }
        }
        // Auto-launch analysis
        launchAnalysis(parsed);
      } catch {}
    }
  }, []);

  const launchAnalysis = async (t) => {
    const currentTarget = t || target;
    if (!currentTarget) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/analyse', { target: currentTarget });
      const result = res.data.analyse;
      const targetKey = currentTarget.nom || currentTarget.titre;
      const toSave = { ...result, _targetKey: targetKey };
      setAnalyse(result);
      sessionStorage.setItem('analyseResult', JSON.stringify(toSave));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLettre = () => {
    sessionStorage.setItem('analyseForLettre', JSON.stringify(analyse));
    navigate('/lettre');
  };

  const filterSuggestions = (suggestions) => {
    if (!suggestions) return [];
    if (priorityFilter === 'all') return suggestions;
    return suggestions.filter(s => s.priorite === priorityFilter);
  };

  // Sort suggestions: haute first, then moyenne, then basse
  const sortSuggestions = (suggestions) => {
    const order = { haute: 0, moyenne: 1, basse: 2 };
    return [...(suggestions || [])].sort((a, b) => (order[a.priorite] ?? 3) - (order[b.priorite] ?? 3));
  };

  if (!target) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analyse</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune cible sélectionnée</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Va sur la page Recherche et clique sur une entreprise ou une offre pour lancer l'analyse.
          </p>
          <button
            onClick={() => navigate('/recherche')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Aller à la recherche
          </button>
        </div>
      </div>
    );
  }

  const targetName = target.nom || target.titre;
  const targetCompany = target.type === 'offre' ? target.entreprise : target.nom;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analyse de correspondance</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Analyse détaillée entre ton profil et la cible sélectionnée.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
          <button onClick={() => launchAnalysis()} className="ml-auto text-xs font-medium underline cursor-pointer">Réessayer</button>
        </div>
      )}

      {/* Target header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0">
            {targetName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                target.type === 'entreprise' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {target.type === 'entreprise' ? 'Candidature spontanée' : 'Réponse à une offre'}
              </span>
              {target.axe && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  target.axe === 'exact' ? 'bg-green-100 text-green-700' :
                  target.axe === 'connexe' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {target.axe === 'exact' ? 'Correspond exactement' : target.axe === 'connexe' ? 'Domaine connexe' : 'Basé sur le profil'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{targetName}</h2>
            <p className="text-sm text-gray-500">
              {target.type === 'entreprise'
                ? `${target.secteur} — ${target.ville} — ${target.taille}`
                : `${target.entreprise} — ${target.ville} — ${target.type_contrat}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {analyse && (
              <button
                onClick={() => { setAnalyse(null); launchAnalysis(); }}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Relancer
              </button>
            )}
            <button
              onClick={() => navigate('/recherche')}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Changer de cible
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Analyse en cours...</p>
          <p className="text-gray-400 text-sm mt-1">L'IA analyse la correspondance entre ton profil et {targetCompany}</p>
        </div>
      )}

      {/* Analysis results */}
      {analyse && !loading && (
        <div className="space-y-6 animate-fadeIn">

          {/* Score overview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Global score circle */}
              <div className="text-center shrink-0">
                <ScoreCircle value={analyse.score_detaille?.global || 0} />
                <p className="text-sm font-medium text-gray-500 mt-2">Score global</p>
              </div>

              {/* Detailed scores */}
              <div className="flex-1 w-full grid gap-3 sm:grid-cols-2">
                <ScoreBar label="Compétences" value={analyse.score_detaille?.competences || 0} icon="🛠" />
                <ScoreBar label="Expérience" value={analyse.score_detaille?.experience || 0} icon="💼" />
                <ScoreBar label="Formation" value={analyse.score_detaille?.formation || 0} icon="🎓" />
                <ScoreBar label="Localisation" value={analyse.score_detaille?.localisation || 0} icon="📍" />
              </div>
            </div>
          </div>

          {/* Points forts & lacunes */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Points forts
              </h3>
              <ul className="space-y-3">
                {(analyse.points_forts || []).map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                </span>
                Lacunes à combler
              </h3>
              <ul className="space-y-3">
                {(analyse.lacunes || []).map((lacune, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-red-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                    {lacune}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Infos entreprise */}
          {analyse.infos_entreprise && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </span>
                À propos de {targetCompany}
              </h3>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{analyse.infos_entreprise.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                {analyse.infos_entreprise.valeurs?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Valeurs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analyse.infos_entreprise.valeurs.map((v, i) => (
                        <span key={i} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">{v}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analyse.infos_entreprise.stack_technique?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Stack technique</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analyse.infos_entreprise.stack_technique.map((t, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {analyse.infos_entreprise.actualites && (
                <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Actualité récente</p>
                  <p className="text-sm text-gray-700">{analyse.infos_entreprise.actualites}</p>
                </div>
              )}

              {analyse.infos_entreprise.conseil_approche && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-yellow-700 mb-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    Conseil d'approche
                  </p>
                  <p className="text-sm text-yellow-800">{analyse.infos_entreprise.conseil_approche}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Suggestions d'amélioration</h3>
              <div className="flex gap-2">
                {['all', 'haute', 'moyenne', 'basse'].map(f => (
                  <button
                    key={f}
                    onClick={() => setPriorityFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      priorityFilter === f
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'Toutes' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Suggestions générales
                </p>
                <div className="space-y-3">
                  {filterSuggestions(sortSuggestions(analyse.suggestions_generales)).map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} color="border-l-blue-500" />
                  ))}
                  {filterSuggestions(sortSuggestions(analyse.suggestions_generales)).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune suggestion avec ce filtre</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Spécifiques à {targetCompany}
                </p>
                <div className="space-y-3">
                  {filterSuggestions(sortSuggestions(analyse.suggestions_specifiques)).map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} color="border-l-purple-500" />
                  ))}
                  {filterSuggestions(sortSuggestions(analyse.suggestions_specifiques)).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune suggestion avec ce filtre</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CTA: generate cover letter */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Prêt à postuler ?</h3>
              <p className="text-green-100 text-sm mt-1">
                Génère une lettre de motivation personnalisée basée sur cette analyse.
              </p>
            </div>
            <button
              onClick={handleGoToLettre}
              className="bg-white text-green-700 px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-50 transition-colors cursor-pointer shadow-sm shrink-0 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Générer la lettre de motivation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
