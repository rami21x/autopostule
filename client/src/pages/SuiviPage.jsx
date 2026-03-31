import { useState, useEffect } from 'react';
import api from '../services/api';

const STATUS_CONFIG = {
  a_envoyer: { label: 'A envoyer', color: 'bg-gray-100 text-gray-700' },
  envoye: { label: 'Envoye', color: 'bg-blue-100 text-blue-700' },
  relance: { label: 'Relance', color: 'bg-yellow-100 text-yellow-700' },
  repondu: { label: 'Repondu', color: 'bg-green-100 text-green-700' },
  refuse: { label: 'Refuse', color: 'bg-red-100 text-red-700' },
};

const STATUS_ORDER = ['a_envoyer', 'envoye', 'relance', 'repondu', 'refuse'];

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.a_envoyer;
  return (
    <span className={`${config.color} text-xs font-medium px-2.5 py-1 rounded-full`}>
      {config.label}
    </span>
  );
}

function RelanceModal({ candidature, onClose, onRelanceSent }) {
  const [message, setMessage] = useState(candidature.relance_message || '');
  const [loading, setLoading] = useState(!candidature.relance_message);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!candidature.relance_message) {
      generateRelance();
    }
  }, []);

  const generateRelance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/candidatures/${candidature.id}/relance`);
      setMessage(res.data.relance.suggested_message);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkSent = async () => {
    setSending(true);
    try {
      await api.put(`/candidatures/${candidature.id}/relance/sent`);
      onRelanceSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Message de relance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Relance pour {candidature.company_name} — {candidature.job_title}
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Generation du message de relance...</p>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={generateRelance}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Regenerer
              </button>
              <button
                onClick={handleCopy}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {copied ? 'Copie !' : 'Copier'}
              </button>
              <button
                onClick={handleMarkSent}
                disabled={sending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Marquer comme envoyee'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LettreModal({ candidature, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Lettre de motivation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {candidature.company_name} — {candidature.job_title}
        </p>
        {candidature.lettre_content ? (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {candidature.lettre_content}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">Aucune lettre sauvegardee.</p>
        )}
      </div>
    </div>
  );
}

export default function SuiviPage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relanceModal, setRelanceModal] = useState(null);
  const [lettreModal, setLettreModal] = useState(null);
  const [statusMenu, setStatusMenu] = useState(null);

  useEffect(() => {
    loadCandidatures();
  }, []);

  const loadCandidatures = async () => {
    try {
      const res = await api.get('/candidatures');
      setCandidatures(res.data.candidatures);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/candidatures/${id}/status`, { status: newStatus });
      setCandidatures((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c))
      );
      setStatusMenu(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/candidatures/${id}`);
      setCandidatures((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = {
    total: candidatures.length,
    a_envoyer: candidatures.filter((c) => c.status === 'a_envoyer').length,
    envoye: candidatures.filter((c) => c.status === 'envoye').length,
    relance: candidatures.filter((c) => c.status === 'relance').length,
    repondu: candidatures.filter((c) => c.status === 'repondu').length,
    refuse: candidatures.filter((c) => c.status === 'refuse').length,
    needs_relance: candidatures.filter((c) => c.needs_relance).length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des candidatures</h1>
        <p className="text-gray-500 mt-1">
          Suis l'etat de tes candidatures et recois des suggestions de relance au bon moment.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-gray-500">{stats.a_envoyer}</p>
          <p className="text-xs text-gray-500">A envoyer</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.envoye}</p>
          <p className="text-xs text-gray-500">Envoye</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.relance}</p>
          <p className="text-xs text-gray-500">Relance</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.repondu}</p>
          <p className="text-xs text-gray-500">Repondu</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.refuse}</p>
          <p className="text-xs text-gray-500">Refuse</p>
        </div>
        {stats.needs_relance > 0 && (
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.needs_relance}</p>
            <p className="text-xs text-orange-600">A relancer</p>
          </div>
        )}
      </div>

      {/* Tableau */}
      {candidatures.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-12">
          <div className="text-4xl mb-4">&#128203;</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune candidature</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Lance une recherche, analyse une entreprise, genere une lettre et sauvegarde-la
            pour voir ta candidature apparaitre ici.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span className="col-span-3">Entreprise</span>
            <span className="col-span-2">Poste</span>
            <span className="col-span-1 text-center">Score</span>
            <span className="col-span-2 text-center">Statut</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          {/* Rows */}
          {candidatures.map((c) => (
            <div
              key={c.id}
              className={`grid md:grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors ${
                c.needs_relance ? 'bg-orange-50/50' : ''
              }`}
            >
              {/* Entreprise */}
              <div className="md:col-span-3">
                <p className="font-medium text-gray-900 text-sm">{c.company_name}</p>
                <p className="text-xs text-gray-400">{c.source === 'spontanee' ? 'Candidature spontanee' : 'Offre'}</p>
              </div>

              {/* Poste */}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-700">{c.job_title}</p>
              </div>

              {/* Score */}
              <div className="md:col-span-1 text-center">
                {c.score ? (
                  <span className="text-sm font-semibold text-gray-700">{c.score}</span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>

              {/* Statut */}
              <div className="md:col-span-2 text-center relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setStatusMenu(statusMenu === c.id ? null : c.id); }}
                  className="inline-block cursor-pointer"
                >
                  <StatusBadge status={c.status} />
                </button>
                {c.needs_relance && (
                  <p className="text-xs text-orange-600 mt-1">Relance suggeree ({c.days_since_update}j)</p>
                )}

                {/* Menu changement statut */}
                {statusMenu === c.id && (
                  <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 left-1/2 -translate-x-1/2 min-w-[140px]">
                    {STATUS_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(c.id, s)}
                        className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                          c.status === s ? 'font-semibold text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">
                  {new Date(c.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex items-center justify-end gap-1">
                {c.lettre_content && (
                  <button
                    onClick={() => setLettreModal(c)}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    title="Voir la lettre"
                  >
                    Lettre
                  </button>
                )}
                {(c.status === 'envoye' || c.needs_relance) && (
                  <button
                    onClick={() => setRelanceModal(c)}
                    className="text-xs text-orange-600 hover:text-orange-800 px-2 py-1 rounded hover:bg-orange-50 transition-colors"
                    title="Generer une relance"
                  >
                    Relancer
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  Suppr.
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {relanceModal && (
        <RelanceModal
          candidature={relanceModal}
          onClose={() => setRelanceModal(null)}
          onRelanceSent={() => {
            setRelanceModal(null);
            loadCandidatures();
          }}
        />
      )}
      {lettreModal && (
        <LettreModal
          candidature={lettreModal}
          onClose={() => setLettreModal(null)}
        />
      )}
    </div>
  );
}
