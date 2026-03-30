export default function RecherchePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Recherche</h1>
        <p className="text-gray-500 mt-1">
          Lance une recherche intelligente pour trouver des entreprises et offres qui correspondent a ton profil.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <div className="py-12">
          <div className="text-4xl mb-4">&#128269;</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Recherche intelligente</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            A partir de ton profil et tes preferences, le LLM identifiera des entreprises cibles
            et des offres correspondantes avec un score de matching.
          </p>
          <button
            disabled
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium opacity-50 cursor-not-allowed"
          >
            Lancer la recherche — Phase 4
          </button>
        </div>
      </div>
    </div>
  );
}
