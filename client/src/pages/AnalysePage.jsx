export default function AnalysePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analyse</h1>
        <p className="text-gray-500 mt-1">
          Compare ton CV avec les exigences de chaque poste et recois des suggestions d'amelioration.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Suggestions generales</h2>
          <p className="text-gray-400 text-sm">
            Competences manquantes, tournures a ameliorer, structure du CV — Phase 5
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Suggestions specifiques</h2>
          <p className="text-gray-400 text-sm">
            Adaptees a l'entreprise cible : vocabulaire, projets a mettre en avant, technologies — Phase 5
          </p>
        </div>
      </div>
    </div>
  );
}
