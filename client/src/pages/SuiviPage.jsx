export default function SuiviPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des candidatures</h1>
        <p className="text-gray-500 mt-1">
          Suis l'etat de tes candidatures et recois des suggestions de relance au bon moment.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* En-tete du tableau */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Entreprise</span>
          <span>Poste</span>
          <span>Score</span>
          <span>Statut</span>
          <span>Date</span>
        </div>

        {/* Etat vide */}
        <div className="px-6 py-12 text-center">
          <p className="text-gray-400 text-sm">
            Aucune candidature pour le moment. Lance une recherche et valide des candidatures
            pour les voir apparaitre ici.
          </p>
          <p className="text-gray-300 text-xs mt-4">Phase 6</p>
        </div>
      </div>
    </div>
  );
}
