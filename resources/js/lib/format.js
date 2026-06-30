// Shared display formatters.

/** Format an ISO date/datetime as a readable date, e.g. "Jun 2, 2026". */
export const fmtDate = (value, lang = 'en') => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/** Format an ISO datetime with time, e.g. "Jun 2, 2026, 03:30 PM". */
export const fmtDateTime = (value, lang = 'en') => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
