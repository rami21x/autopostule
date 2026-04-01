import { useMemo } from 'react';

const requirements = [
  { label: '12 caractères minimum', test: (p) => p.length >= 12 },
  { label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
  { label: 'Un chiffre', test: (p) => /[0-9]/.test(p) },
  { label: 'Un caractère spécial', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const strengthLevels = [
  { label: 'Très faible', color: 'bg-red-500' },
  { label: 'Faible', color: 'bg-orange-500' },
  { label: 'Moyen', color: 'bg-yellow-500' },
  { label: 'Fort', color: 'bg-green-400' },
  { label: 'Très fort', color: 'bg-green-600' },
];

export default function PasswordStrengthIndicator({ password }) {
  const { score, passed } = useMemo(() => {
    if (!password) return { score: 0, passed: requirements.map(() => false) };
    const passed = requirements.map((r) => r.test(password));
    const score = passed.filter(Boolean).length;
    return { score, passed };
  }, [password]);

  if (!password) return null;

  const level = strengthLevels[Math.max(0, score - 1)] || strengthLevels[0];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {strengthLevels.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? level.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${score <= 2 ? 'text-red-600' : score <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        {level.label}
      </p>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {passed[i] ? (
              <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className={passed[i] ? 'text-green-700' : 'text-gray-400'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
