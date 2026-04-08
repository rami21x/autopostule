import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const STATUS_CONFIG = {
  a_envoyer: { label: 'À envoyer', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', icon: '📝' },
  envoye: { label: 'Envoyé', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: '📤' },
  relance: { label: 'Relancé', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', icon: '🔄' },
  entretien: { label: 'Entretien', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: '🎤' },
  repondu: { label: 'Répondu', color: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: '✅' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: '❌' },
};
const STATUS_ORDER = ['a_envoyer', 'envoye', 'relance', 'entretien', 'repondu', 'refuse'];

/* ───── Modals ───── */

function SendEmailModal({ candidature, type, onClose, onSent, defaultMessage }) {
  const [email, setEmail] = useState(candidature.contact_email || '');
  const [message, setMessage] = useState(defaultMessage || '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) { setError('Adresse email requise'); return; }
    setSending(true);
    setError('');
    try {
      if (type === 'candidature') {
        await api.post(`/candidatures/${candidature.id}/send-email`, { to: email });
      } else {
        await api.post(`/candidatures/${candidature.id}/send-relance`, { to: email, message });
      }
      onSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">
            {type === 'candidature' ? 'Envoyer la candidature par email' : 'Envoyer la relance par email'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
        </div>

        {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email du destinataire</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="rh@entreprise.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {type === 'relance' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Message de relance</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={8}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
              />
            </div>
          )}

          {type === 'candidature' && (
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-700">La lettre de motivation sauvegardée sera envoyée en contenu de l'email.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
              Annuler
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Envoi...
                </>
              ) : 'Envoyer par email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelanceModal({ candidature, emailConfigured, onClose, onRelanceSent }) {
  const [message, setMessage] = useState(candidature.relance_message || '');
  const [loading, setLoading] = useState(!candidature.relance_message);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (!candidature.relance_message) generateRelance();
  }, []);

  const generateRelance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/candidatures/${candidature.id}/relance`);
      setMessage(res.data.relance.suggested_message);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la génération.');
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
    try {
      await api.put(`/candidatures/${candidature.id}/relance/sent`);
      onRelanceSent();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur.');
    }
  };

  if (showEmailModal) {
    return (
      <SendEmailModal
        candidature={candidature}
        type="relance"
        defaultMessage={message}
        onClose={() => setShowEmailModal(false)}
        onSent={onRelanceSent}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900">Message de relance</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{candidature.company_name} — {candidature.job_title}</p>

        {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Génération du message de relance...</p>
          </div>
        ) : (
          <>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={8}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed mb-4"
            />
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button onClick={generateRelance} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                Régénérer
              </button>
              <button onClick={handleCopy} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                {copied ? 'Copié !' : 'Copier'}
              </button>
              {emailConfigured && (
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  Envoyer par email
                </button>
              )}
              <button
                onClick={handleMarkSent}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Marquer envoyée
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900">Lettre de motivation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{candidature.company_name} — {candidature.job_title}</p>
        {candidature.lettre_content ? (
          <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
            {candidature.lettre_content}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">Aucune lettre sauvegardée.</p>
        )}
      </div>
    </div>
  );
}

function NotesModal({ candidature, onClose, onSave }) {
  const [notes, setNotes] = useState(candidature.notes || '');
  const [contactEmail, setContactEmail] = useState(candidature.contact_email || '');
  const [delayDays, setDelayDays] = useState(candidature.relance_delay_days || 15);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/candidatures/${candidature.id}`, {
        notes,
        contact_email: contactEmail,
        relance_delay_days: delayDays,
      });
      onSave();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Détails — {candidature.company_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email du contact RH</label>
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              placeholder="rh@entreprise.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Délai avant relance (jours)</label>
            <input
              type="number"
              value={delayDays}
              onChange={e => setDelayDays(parseInt(e.target.value) || 15)}
              min={1}
              max={90}
              className="w-24 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes personnelles</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Contact RH : Marie Dupont, entretien prévu le..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">Annuler</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── Candidature Card ───── */

function CandidatureCard({ c, onStatusChange, onDelete, onRelance, onLettre, onNotes, onSendEmail, emailConfigured }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowStatusMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const config = STATUS_CONFIG[c.status] || STATUS_CONFIG.a_envoyer;
  const daysText = c.days_since_update !== undefined ? `${c.days_since_update}j` : '';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${
      c.needs_relance ? 'border-orange-300 ring-1 ring-orange-100' : 'border-gray-200'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
              {c.company_name?.[0]}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{c.company_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{c.job_title}</p>
            </div>
          </div>
          {c.score && (
            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
              c.score >= 75 ? 'bg-green-100 text-green-700' :
              c.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {c.score}%
            </div>
          )}
        </div>

        {/* Status + date */}
        <div className="flex items-center justify-between mb-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`${config.color} text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer inline-flex items-center gap-1`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
              {config.label}
              <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showStatusMenu && (
              <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[150px] left-0">
                {STATUS_ORDER.map(s => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(c.id, s); setShowStatusMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 ${
                      c.status === s ? 'font-semibold text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s].dot}`}></span>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            {c.status === 'envoye' && daysText && (
              <span className={`font-medium ${c.needs_relance ? 'text-orange-600' : 'text-gray-500'}`}>
                ({daysText})
              </span>
            )}
          </div>
        </div>

        {/* Relance alert */}
        {c.needs_relance && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-orange-700 font-medium">
              Relance recommandée ({c.days_since_update}j sans réponse, délai fixé à {c.relance_delay_days || 15}j)
            </span>
          </div>
        )}

        {/* Notes preview */}
        {c.notes && (
          <p className="text-xs text-gray-500 italic mb-3 truncate">
            {c.notes}
          </p>
        )}

        {/* Contact email */}
        {c.contact_email && (
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            {c.contact_email}
          </p>
        )}

        {/* Source badge */}
        <div className="mb-3">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            c.source === 'spontanee' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          }`}>
            {c.source === 'spontanee' ? 'Spontanée' : 'Offre'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
          {c.lettre_content && (
            <button onClick={() => onLettre(c)} className="text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              Lettre
            </button>
          )}
          {c.lettre_content && c.status === 'a_envoyer' && emailConfigured && (
            <button onClick={() => onSendEmail(c)} className="text-xs text-green-600 hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              Envoyer
            </button>
          )}
          {(c.status === 'envoye' || c.needs_relance) && (
            <button onClick={() => onRelance(c)} className="text-xs text-orange-600 hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              Relancer
            </button>
          )}
          <button onClick={() => onNotes(c)} className="text-xs text-gray-500 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
            Notes
          </button>
          <button onClick={() => onDelete(c.id)} className="text-xs text-red-400 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ml-auto">
            Suppr.
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── Stats Bar ───── */

function StatsBar({ stats }) {
  const items = [
    { key: 'total', label: 'Total', value: stats.total, color: 'text-gray-900' },
    { key: 'a_envoyer', label: 'À envoyer', value: stats.a_envoyer, color: 'text-gray-500' },
    { key: 'envoye', label: 'Envoyé', value: stats.envoye, color: 'text-blue-600' },
    { key: 'relance', label: 'Relancé', value: stats.relance, color: 'text-yellow-600' },
    { key: 'entretien', label: 'Entretien', value: stats.entretien, color: 'text-purple-600' },
    { key: 'repondu', label: 'Répondu', value: stats.repondu, color: 'text-green-600' },
    { key: 'refuse', label: 'Refusé', value: stats.refuse, color: 'text-red-600' },
  ];

  const responseRate = stats.total > 0
    ? Math.round(((stats.repondu + stats.entretien) / stats.total) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {items.map(item => (
            <div key={item.key} className="text-center min-w-[60px]">
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {stats.needs_relance > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-orange-600">{stats.needs_relance}</p>
              <p className="text-[10px] text-orange-600 uppercase tracking-wider">À relancer</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-lg font-bold text-indigo-600">{responseRate}%</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Taux réponse</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {stats.repondu > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(stats.repondu / stats.total) * 100}%` }} />}
          {stats.entretien > 0 && <div className="bg-purple-500 transition-all" style={{ width: `${(stats.entretien / stats.total) * 100}%` }} />}
          {stats.relance > 0 && <div className="bg-yellow-500 transition-all" style={{ width: `${(stats.relance / stats.total) * 100}%` }} />}
          {stats.envoye > 0 && <div className="bg-blue-500 transition-all" style={{ width: `${(stats.envoye / stats.total) * 100}%` }} />}
          {stats.a_envoyer > 0 && <div className="bg-gray-300 transition-all" style={{ width: `${(stats.a_envoyer / stats.total) * 100}%` }} />}
          {stats.refuse > 0 && <div className="bg-red-400 transition-all" style={{ width: `${(stats.refuse / stats.total) * 100}%` }} />}
        </div>
      )}
    </div>
  );
}

/* ───── Main Page ───── */

export default function SuiviPage() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [filter, setFilter] = useState('all');
  const [relanceModal, setRelanceModal] = useState(null);
  const [lettreModal, setLettreModal] = useState(null);
  const [notesModal, setNotesModal] = useState(null);
  const [sendEmailModal, setSendEmailModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadCandidatures(); }, []);

  const loadCandidatures = async () => {
    try {
      const res = await api.get('/candidatures');
      setCandidatures(res.data.candidatures);
      setEmailConfigured(res.data.email_configured || false);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/candidatures/${id}/status`, { status: newStatus });
      setCandidatures(prev =>
        prev.map(c => c.id === id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c)
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/candidatures/${id}`);
      setCandidatures(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/candidatures/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'candidatures.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Erreur lors de l\'export.');
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
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
    a_envoyer: candidatures.filter(c => c.status === 'a_envoyer').length,
    envoye: candidatures.filter(c => c.status === 'envoye').length,
    relance: candidatures.filter(c => c.status === 'relance').length,
    entretien: candidatures.filter(c => c.status === 'entretien').length,
    repondu: candidatures.filter(c => c.status === 'repondu').length,
    refuse: candidatures.filter(c => c.status === 'refuse').length,
    needs_relance: candidatures.filter(c => c.needs_relance).length,
  };

  const filtered = filter === 'all'
    ? candidatures
    : filter === 'needs_relance'
      ? candidatures.filter(c => c.needs_relance)
      : candidatures.filter(c => c.status === filter);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suivi des candidatures</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gère tes candidatures, envoie des emails et programme tes relances.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={candidatures.length === 0}
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 inline-flex items-center gap-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 cursor-pointer">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'Toutes', count: stats.total },
          ...STATUS_ORDER.map(s => ({ key: s, label: STATUS_CONFIG[s].label, count: stats[s] })),
          ...(stats.needs_relance > 0 ? [{ key: 'needs_relance', label: 'À relancer', count: stats.needs_relance }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filter === tab.key
                ? tab.key === 'needs_relance' ? 'bg-orange-600 text-white' : 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {candidatures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Aucune candidature</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Lance une recherche, analyse une entreprise, génère une lettre et sauvegarde-la pour voir ta candidature apparaître ici.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">Aucune candidature avec ce filtre.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <CandidatureCard
              key={c.id}
              c={c}
              emailConfigured={emailConfigured}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onRelance={setRelanceModal}
              onLettre={setLettreModal}
              onNotes={setNotesModal}
              onSendEmail={setSendEmailModal}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {relanceModal && (
        <RelanceModal
          candidature={relanceModal}
          emailConfigured={emailConfigured}
          onClose={() => setRelanceModal(null)}
          onRelanceSent={() => {
            setRelanceModal(null);
            showSuccess('Relance envoyée !');
            loadCandidatures();
          }}
        />
      )}
      {lettreModal && <LettreModal candidature={lettreModal} onClose={() => setLettreModal(null)} />}
      {notesModal && (
        <NotesModal
          candidature={notesModal}
          onClose={() => setNotesModal(null)}
          onSave={() => {
            setNotesModal(null);
            showSuccess('Détails sauvegardés !');
            loadCandidatures();
          }}
        />
      )}
      {sendEmailModal && (
        <SendEmailModal
          candidature={sendEmailModal}
          type="candidature"
          onClose={() => setSendEmailModal(null)}
          onSent={() => {
            setSendEmailModal(null);
            showSuccess('Candidature envoyée par email !');
            loadCandidatures();
          }}
        />
      )}
    </div>
  );
}
