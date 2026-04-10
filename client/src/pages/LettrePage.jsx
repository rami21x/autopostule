import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import api from '../services/api';
import LettrePDF from '../components/LettrePDF';

async function downloadLettrePDF(doc, filename) {
  try {
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('[PDF] échec téléchargement :', err);
    alert('Erreur de génération du PDF : ' + (err.message || 'inconnue'));
  }
}

function SectionEditor({ label, value, onChange, onRegenerate, regenerating, color = 'blue' }) {
  const [editing, setEditing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState('');

  const colors = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', label: 'text-blue-700', icon: 'text-blue-500' },
    green: { bg: 'bg-green-50', border: 'border-green-200', label: 'text-green-700', icon: 'text-green-500' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', label: 'text-purple-700', icon: 'text-purple-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', label: 'text-orange-700', icon: 'text-orange-500' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`rounded-xl border ${c.border} ${editing ? c.bg : 'bg-white'} p-4 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider ${c.label}`}>{label}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(!editing)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors cursor-pointer ${
              editing ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {editing ? 'Aperçu' : 'Modifier'}
          </button>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            disabled={regenerating}
            className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            {regenerating ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                IA...
              </>
            ) : '✨ Réécrire'}
          </button>
        </div>
      </div>

      {showInstructions && !regenerating && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onRegenerate(instructions);
                setShowInstructions(false);
                setInstructions('');
              }
            }}
            placeholder="Par exemple : Plus formel, mentionne mon stage chez X, ajoute un chiffre..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => { onRegenerate(instructions); setShowInstructions(false); setInstructions(''); }}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium cursor-pointer hover:bg-purple-700"
          >
            Générer
          </button>
        </div>
      )}

      {editing ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={Math.max(3, Math.ceil(value.length / 80))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
        />
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{value}</p>
      )}
    </div>
  );
}

export default function LettrePage() {
  const [target, setTarget] = useState(null);
  const [analyse, setAnalyse] = useState(null);
  const [lettre, setLettre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [regeneratingSection, setRegeneratingSection] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'preview'
  const navigate = useNavigate();

  // Sections editables
  const [objet, setObjet] = useState('');
  const [accroche, setAccroche] = useState('');
  const [parcours, setParcours] = useState('');
  const [adequation, setAdequation] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [formulePolice, setFormulePolice] = useState('');

  // Metadata
  const [expediteur, setExpediteur] = useState(null);
  const [destinataire, setDestinataire] = useState(null);
  const [dateLine, setDateLine] = useState('');
  const [motsCles, setMotsCles] = useState([]);
  const [correspondances, setCorrespondances] = useState([]);

  useEffect(() => {
    const savedTarget = sessionStorage.getItem('selectedTarget');
    const savedAnalyse = sessionStorage.getItem('analyseForLettre');

    if (savedTarget) {
      try { setTarget(JSON.parse(savedTarget)); } catch {}
    }
    if (savedAnalyse) {
      try { setAnalyse(JSON.parse(savedAnalyse)); } catch {}
    }

    const savedLettre = sessionStorage.getItem('generatedLettre');
    if (savedLettre) {
      try {
        const parsed = JSON.parse(savedLettre);
        applyLettre(parsed);
      } catch {}
    }
  }, []);

  const applyLettre = (result) => {
    setLettre(result);
    setObjet(result.objet || '');
    setAccroche(result.accroche || '');
    setParcours(result.parcours || '');
    setAdequation(result.adequation || '');
    setConclusion(result.conclusion || '');
    setFormulePolice(result.formule_politesse || 'Je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.');
    setExpediteur(result.expediteur || null);
    setDestinataire(result.destinataire || null);
    setDateLine(result.date || '');
    setMotsCles(result.mots_cles_utilises || result.points_cles_utilises || []);
    setCorrespondances(result.correspondances_experiences || []);
  };

  const handleGenerate = async () => {
    if (!target) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setSaved(false);

    try {
      const res = await api.post('/lettre/generate', { target, analyse });
      const result = res.data.lettre;
      applyLettre(result);
      sessionStorage.setItem('generatedLettre', JSON.stringify(result));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la génération.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSection = async (sectionName, instructions) => {
    setRegeneratingSection(sectionName);
    try {
      const res = await api.post('/lettre/regenerate-section', {
        section: sectionName,
        target,
        instructions,
      });
      const newText = res.data.section;
      if (sectionName === 'accroche') setAccroche(newText);
      else if (sectionName === 'parcours') setParcours(newText);
      else if (sectionName === 'adequation') setAdequation(newText);
      else if (sectionName === 'conclusion') setConclusion(newText);
      setSaved(false);
    } catch (err) {
      setError('Erreur lors de la régénération de la section.');
    } finally {
      setRegeneratingSection(null);
    }
  };

  const getFullText = () => {
    let text = '';
    if (expediteur) {
      text += `${expediteur.nom_prenom}\n${expediteur.ville}\n${expediteur.telephone}\n${expediteur.email}\n\n`;
    }
    if (destinataire) {
      text += `${destinataire.entreprise}\n${destinataire.ville}\n\n`;
    }
    if (dateLine) text += `${dateLine}\n\n`;
    if (objet) text += `Objet : ${objet}\n\n`;
    text += 'Madame, Monsieur,\n\n';
    text += `${accroche}\n\n${parcours}\n\n${adequation}\n\n${conclusion}\n\n${formulePolice}\n\n`;
    if (expediteur) text += expediteur.nom_prenom;
    return text;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFullText()).then(() => {
      setSuccess('Lettre copiée ! Prête à coller.');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const handleSave = async () => {
    if (!accroche.trim()) {
      setError('La lettre est vide.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/lettre/save', {
        target,
        content: getFullText(),
        objet,
      });
      setSaved(true);
      setSuccess('Parfait ! Ta lettre est sauvegardée. Rends-toi sur l\'onglet Suivi pour envoyer ta candidature.');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const bodyText = `${accroche} ${parcours} ${adequation} ${conclusion}`;
  const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0;

  if (!target) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lettre de motivation</h1>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune cible sélectionnée</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4">
            Sélectionne une entreprise, lance l'analyse, puis reviens ici pour générer ta lettre.
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
        <h1 className="text-2xl font-bold text-gray-900">Lettre de motivation</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Lettre personnalisée pour {targetCompany} — chaque section est modifiable.
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
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Target card + generate button */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0">
            {targetName?.[0]}
          </div>
          <div className="flex-1">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              target.type === 'entreprise' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {target.type === 'entreprise' ? 'Candidature spontanée' : 'Réponse à une offre'}
            </span>
            <h2 className="text-lg font-bold text-gray-900 mt-1">{targetName}</h2>
            <p className="text-sm text-gray-500">
              {target.type === 'entreprise'
                ? `${target.secteur} — ${target.ville}`
                : `${target.entreprise} — ${target.ville}`}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2 shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Génération...
              </>
            ) : lettre ? 'Régénérer toute la lettre' : 'Générer la lettre'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Rédaction en cours...</p>
          <p className="text-gray-400 text-sm mt-1">Rédaction de ta lettre personnalisée pour {targetCompany}...</p>
        </div>
      )}

      {/* Letter content */}
      {lettre && !loading && (
        <div className="space-y-6 animate-fadeIn">

          {/* View mode toggle + stats */}
          <div className="flex items-center justify-between">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'edit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Édition par section
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                Aperçu lettre
              </button>
            </div>
            <span className="text-xs text-gray-400">{wordCount} mots</span>
          </div>

          {viewMode === 'edit' ? (
            <>
              {/* Objet */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Objet</label>
                <input
                  type="text"
                  value={objet}
                  onChange={e => { setObjet(e.target.value); setSaved(false); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Editable sections */}
              <SectionEditor
                label="Accroche"
                value={accroche}
                onChange={v => { setAccroche(v); setSaved(false); }}
                onRegenerate={instr => handleRegenerateSection('accroche', instr)}
                regenerating={regeneratingSection === 'accroche'}
                color="blue"
              />

              <SectionEditor
                label="Parcours & compétences"
                value={parcours}
                onChange={v => { setParcours(v); setSaved(false); }}
                onRegenerate={instr => handleRegenerateSection('parcours', instr)}
                regenerating={regeneratingSection === 'parcours'}
                color="green"
              />

              <SectionEditor
                label="Adéquation & apport"
                value={adequation}
                onChange={v => { setAdequation(v); setSaved(false); }}
                onRegenerate={instr => handleRegenerateSection('adequation', instr)}
                regenerating={regeneratingSection === 'adequation'}
                color="purple"
              />

              <SectionEditor
                label="Conclusion"
                value={conclusion}
                onChange={v => { setConclusion(v); setSaved(false); }}
                onRegenerate={instr => handleRegenerateSection('conclusion', instr)}
                regenerating={regeneratingSection === 'conclusion'}
                color="orange"
              />

              {/* Formule de politesse */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Formule de politesse</label>
                <input
                  type="text"
                  value={formulePolice}
                  onChange={e => { setFormulePolice(e.target.value); setSaved(false); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          ) : (
            /* Preview mode — formatted letter */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-12 font-serif">
              {/* Expéditeur */}
              {expediteur && (
                <div className="text-sm text-gray-700 mb-6">
                  <p className="font-semibold">{expediteur.nom_prenom}</p>
                  <p>{expediteur.ville}</p>
                  <p>{expediteur.telephone}</p>
                  <p>{expediteur.email}</p>
                </div>
              )}

              {/* Destinataire */}
              {destinataire && (
                <div className="text-sm text-gray-700 mb-4 text-right">
                  <p className="font-semibold">{destinataire.entreprise}</p>
                  <p>{destinataire.ville}</p>
                </div>
              )}

              {/* Date */}
              {dateLine && (
                <p className="text-sm text-gray-600 mb-4 text-right italic">{dateLine}</p>
              )}

              {/* Objet */}
              {objet && (
                <p className="text-sm text-gray-800 mb-6">
                  <span className="font-semibold">Objet :</span> {objet}
                </p>
              )}

              {/* Body */}
              <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                <p>Madame, Monsieur,</p>
                <p>{accroche}</p>
                <p>{parcours}</p>
                <p>{adequation}</p>
                <p>{conclusion}</p>
                <p>{formulePolice}</p>
              </div>

              {/* Signature */}
              {expediteur && (
                <p className="mt-8 text-sm font-semibold text-gray-800">{expediteur.nom_prenom}</p>
              )}
            </div>
          )}

          {/* Mots-clés utilisés + correspondances */}
          <div className="grid gap-6 sm:grid-cols-2">
            {motsCles.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    </svg>
                  </span>
                  Termes clés du poste utilisés
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {motsCles.map((m, i) => (
                    <span key={i} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {correspondances.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.06a4.5 4.5 0 00-6.364-6.364L4.5 8.161a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </span>
                  Tes expériences liées au poste
                </h3>
                <div className="space-y-2">
                  {correspondances.map((c, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-blue-800">{c.experience}</p>
                      <p className="text-xs text-blue-600">{c.lien_poste}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <button
                onClick={handleCopy}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copier tout
              </button>
              <button
                onClick={() => downloadLettrePDF(
                  <LettrePDF
                    expediteur={expediteur}
                    destinataire={destinataire}
                    date={dateLine}
                    objet={objet}
                    accroche={accroche}
                    parcours={parcours}
                    adequation={adequation}
                    conclusion={conclusion}
                    formulePolice={formulePolice}
                  />,
                  `Lettre_motivation_${(targetCompany || 'candidature').replace(/\s+/g, '_')}.pdf`
                )}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-900 transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Télécharger en PDF
              </button>
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-2 ${
                  saved
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sauvegarde...
                  </>
                ) : saved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sauvegardée !
                  </>
                ) : 'Sauvegarder et créer la candidature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
