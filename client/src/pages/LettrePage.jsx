export default function LettrePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lettre de motivation</h1>
        <p className="text-gray-500 mt-1">
          Genere une lettre de motivation personnalisee pour chaque entreprise cible.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="py-12 text-center">
          <div className="text-4xl mb-4">&#9997;&#65039;</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Generation de lettre</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Selectionne une entreprise depuis la page Recherche pour generer une lettre
            de motivation personnalisee. Tu pourras la modifier avant de l'enregistrer.
          </p>
          <p className="text-gray-300 text-xs mt-6">Phase 5</p>
        </div>
      </div>
    </div>
  );
}
