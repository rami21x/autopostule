export default function ProfilPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-500 mt-1">
          Upload ton CV et renseigne tes preferences pour personnaliser ta recherche.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload CV */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">CV (PDF)</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-sm">Upload CV — Phase 3</p>
          </div>
        </div>

        {/* Profil extrait */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Profil extrait</h2>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Les competences, formations et experiences extraites de ton CV apparaitront ici.
            </p>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Preferences</h2>
          <p className="text-gray-400 text-sm">
            Formulaire de preferences (secteur, type de contrat, localisation, mots-cles) — Phase 3
          </p>
        </div>
      </div>
    </div>
  );
}
