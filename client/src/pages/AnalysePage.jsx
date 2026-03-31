import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ScoreBar({ label, value }) {
  let color = 'bg-red-500';
  if (value >= 80) color = 'bg-green-500';
  else if (value >= 60) color = 'bg-yellow-500';
  else if (value >= 40) color = 'bg-orange-500';

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function PrioriteBadge({ priorite }) {
  const colors = {
    haute: 'bg-red-100 text-red-700',
    moyenne: 'bg-yellow-100 text-yellow-700',
    basse: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`${colors[priorite] || colors.basse} text-xs px-2 py-0.5 rounded-full`}>
      {priorite}
    </span>
  );
}

function SuggestionCard({ suggestion, color }) {
  return (
    <div className={`border-l-4 ${color} bg-white rounded-lg border border-gray-200 p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {suggestion.categorie}
          </span>
          <PrioriteBadge priorite={suggestion.priorite} />
        </div>
      </div>
      <h4 className="font-medium text-gray-900 text-sm mb-1">{suggestion.titre}</h4>
      <p className="text-sm text-gray-600">{suggestion.description}</p>
    </div>
  );
}

export default function AnalysePage() {
  const [target, setTarget] = useState(null);
  const [analyse, setAnalyse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Charger la cible depuis sessionStorage
    const saved = sessionStorage.getItem('selectedTarget');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTarget(parsed);

        // Verifier si une analyse existe deja
        const savedAnalyse = sessionStorage.getItem('analyseResult');
        if (savedAnalyse) {
          const parsedAnalyse = JSON.parse(savedAnalyse);
          // Verifier que c'est pour la meme cible
          const targetKey = parsed.nom || parsed.titre;
          if (parsedAnalyse._targetKey === targetKey) {
            setAnalyse(parsedAnalyse);
          }
        }
      } catch {}
    }
  }, []);

  const handleAnalyse = async () => {
    if (!target) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/analyse', { target });
      const result = res.data.analyse;
      const targetKey = target.nom || target.titre;
      const toSave = { ...result, _targetKey: targetKey };
      setAnalyse(result);
      sessionStorage.setItem('analyseResult', JSON.stringify(toSave));
    } catch (err) {
      const message = err.response?.data?.error || 'Erreur lors de l\'analyse.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLettre = () => {
    // Passer l'analyse a la page Lettre
    sessionStorage.setItem('analyseForLettre', JSON.stringify(analyse));
    navigate('/lettre');
  };

  if (!target) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analyse</h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-12">
          <div className="text-4xl mb-4">&#128203;</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune cible selectionnee</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Va sur la page Recherche et clique sur une entreprise ou une offre pour lancer l'analyse.
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
        <h1 className="text-2xl font-bold text-gray-900">Analyse</h1>
        <p className="text-gray-500 mt-1">
          Analyse de correspondance entre ton profil et la cible selectionnee.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Cible selectionnee */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              {target.type === 'entreprise' ? 'Candidature spontanee' : 'Reponse a une offre'}
            </p>
            <h2 className="text-lg font-semibold text-gray-900">{targetName}</h2>
            <p className="text-sm text-gray-500">
              {target.type === 'entreprise'
                ? `${target.secteur} — ${target.ville} — ${target.taille}`
                : `${target.entreprise} — ${target.ville} — ${target.type_contrat}`}
            </p>
          </div>
          <div className="flex gap-2">
            {!analyse && (
              <button
                onClick={handleAnalyse}
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyse en cours...
                  </>
                ) : (
                  'Lancer l\'analyse'
                )}
              </button>
            )}
            <button
              onClick={() => navigate('/recherche')}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Changer de cible
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Le LLM analyse la correspondance entre ton profil et {targetCompany}...</p>
        </div>
      )}

      {/* Resultats de l'analyse */}
      {analyse && !loading && (
        <div className="space-y-6">
          {/* Scores detailles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Score de correspondance</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {analyse.score_detaille && (
                <>
                  <ScoreBar label="Competences" value={analyse.score_detaille.competences} />
                  <ScoreBar label="Experience" value={analyse.score_detaille.experience} />
                  <ScoreBar label="Formation" value={analyse.score_detaille.formation} />
                  <ScoreBar label="Localisation" value={analyse.score_detaille.localisation} />
                </>
              )}
            </div>
            {analyse.score_detaille?.global && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Score global</span>
                  <span className="text-2xl font-bold text-blue-600">{analyse.score_detaille.global}/100</span>
                </div>
              </div>
            )}
          </div>

          {/* Points forts et lacunes */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-green-700 mb-3">Points forts</h3>
              <ul className="space-y-2">
                {(analyse.points_forts || []).map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-red-700 mb-3">Lacunes a combler</h3>
              <ul className="space-y-2">
                {(analyse.lacunes || []).map((lacune, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-500 mt-0.5 flex-shrink-0">&#10007;</span>
                    {lacune}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions generales + specifiques */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Suggestions generales</h3>
              <p className="text-sm text-gray-400 mb-4">Ameliorations valables pour ce type de poste</p>
              <div className="space-y-3">
                {(analyse.suggestions_generales || []).map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} color="border-l-blue-500" />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Suggestions specifiques a {targetCompany}</h3>
              <p className="text-sm text-gray-400 mb-4">Adaptees a cette entreprise precise</p>
              <div className="space-y-3">
                {(analyse.suggestions_specifiques || []).map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} color="border-l-purple-500" />
                ))}
              </div>
            </div>
          </div>

          {/* Infos entreprise */}
          {analyse.infos_entreprise && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Informations sur {targetCompany}</h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">{analyse.infos_entreprise.description}</p>

                {analyse.infos_entreprise.valeurs?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Valeurs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analyse.infos_entreprise.valeurs.map((v, i) => (
                        <span key={i} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">{v}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analyse.infos_entreprise.stack_technique?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Stack technique</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analyse.infos_entreprise.stack_technique.map((t, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analyse.infos_entreprise.actualites && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Actualite</p>
                    <p className="text-sm text-gray-600">{analyse.infos_entreprise.actualites}</p>
                  </div>
                )}

                {analyse.infos_entreprise.conseil_approche && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                    <p className="text-xs font-medium text-yellow-700 mb-1">Conseil d'approche</p>
                    <p className="text-sm text-yellow-800">{analyse.infos_entreprise.conseil_approche}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bouton generer lettre */}
          <div className="text-center py-4">
            <button
              onClick={handleGoToLettre}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              &#9997;&#65039; Generer la lettre de motivation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
