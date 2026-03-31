import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ScoreBadge({ score }) {
  let color = 'bg-red-100 text-red-700';
  if (score >= 80) color = 'bg-green-100 text-green-700';
  else if (score >= 60) color = 'bg-yellow-100 text-yellow-700';
  else if (score >= 40) color = 'bg-orange-100 text-orange-700';

  return (
    <span className={`${color} text-xs font-bold px-2.5 py-1 rounded-full`}>
      {score}/100
    </span>
  );
}

function EntrepriseCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{item.nom}</h3>
          <p className="text-sm text-gray-500">{item.secteur} — {item.ville}</p>
        </div>
        <ScoreBadge score={item.score} />
      </div>
      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
          {item.taille}
        </span>
        <span className="text-xs text-gray-400">
          Contact : {item.contact_cible}
        </span>
      </div>
      <p className="text-xs text-green-600 mt-2 italic">{item.pourquoi_postuler}</p>
    </div>
  );
}

function OffreCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{item.titre}</h3>
          <p className="text-sm text-gray-500">{item.entreprise} — {item.ville}</p>
        </div>
        <ScoreBadge score={item.score} />
      </div>
      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
          {item.type_contrat}
        </span>
        {(item.competences_requises || []).slice(0, 4).map((comp, i) => (
          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {comp}
          </span>
        ))}
      </div>
    </div>
  );
}

// Charger les resultats depuis sessionStorage au montage
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
      // Persister les resultats
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
    // Stocker la cible selectionnee pour la page Analyse
    sessionStorage.setItem('selectedTarget', JSON.stringify({ ...target, type }));
    navigate('/analyse');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recherche</h1>
        <p className="text-gray-500 mt-1">
          Lance une recherche intelligente pour trouver des entreprises et offres qui correspondent a ton profil.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Bouton de recherche */}
      <div className="mb-8 text-center">
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Recherche en cours...
            </>
          ) : (
            <>
              &#128269; {searched ? 'Relancer la recherche' : 'Lancer la recherche'}
            </>
          )}
        </button>
        {loading && (
          <p className="text-sm text-gray-400 mt-2">
            Le LLM analyse ton profil et identifie des cibles pertinentes...
          </p>
        )}
      </div>

      {/* Resultats */}
      {searched && !loading && (
        <div className="space-y-8">
          {/* Entreprises (candidature spontanee) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Entreprises cibles — candidature spontanee
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Entreprises qui pourraient recruter, meme sans offre publiee. Clique sur une carte pour analyser la correspondance.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {entreprises.map((e, i) => (
                <EntrepriseCard
                  key={i}
                  item={e}
                  onClick={() => handleSelectTarget(e, 'entreprise')}
                />
              ))}
            </div>
            {entreprises.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Aucune entreprise trouvee.</p>
            )}
          </div>

          {/* Offres */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Offres correspondantes
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Offres d'alternance ou stage qui correspondent a ton profil. Clique sur une carte pour voir l'analyse detaillee.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {offres.map((o, i) => (
                <OffreCard
                  key={i}
                  item={o}
                  onClick={() => handleSelectTarget(o, 'offre')}
                />
              ))}
            </div>
            {offres.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Aucune offre trouvee.</p>
            )}
          </div>
        </div>
      )}

      {/* Etat initial */}
      {!searched && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="py-8">
            <div className="text-4xl mb-4">&#128269;</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Pret a chercher</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Assure-toi d'avoir uploade ton CV et rempli tes preferences dans la page Profil,
              puis clique sur "Lancer la recherche" pour decouvrir des entreprises et offres cibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
