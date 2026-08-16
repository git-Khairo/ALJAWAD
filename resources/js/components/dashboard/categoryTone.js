/**
 * Categorical tones for the dashboards.
 *
 * Some admin views colour-code a category (which broker an IB belongs to,
 * which role a coach holds) so the structure reads at a glance. That is a
 * legitimate use of colour, but the brand has exactly one accent, so the
 * ramp is built from the palette rather than by reaching for six unrelated
 * Tailwind hues, which is what these files used to do.
 *
 * Six entries, each distinguishable at badge size: the accent at two
 * strengths, the two market-direction colours, the attention colour, and a
 * neutral. They are deliberately ordered so that adjacent indexes contrast.
 */
export const CATEGORY_TONES = [
  'text-primary    bg-primary/12    border-primary/30',
  'text-chart-up   bg-chart-up/12   border-chart-up/30',
  'text-warn       bg-warn/12       border-warn/30',
  'text-chart-down bg-chart-down/12 border-chart-down/30',
  'text-fg-muted   bg-surface-sunken border-rule-strong',
  'text-foreground bg-primary/25    border-primary/50',
];

export const NEUTRAL_TONE = 'text-fg-muted bg-surface-sunken border-rule';

/** Stable tone for a numeric id. */
export const toneForId = (id) =>
  CATEGORY_TONES[Math.abs(Number(id) || 0) % CATEGORY_TONES.length];

/** Stable tone for a string key, hashed so the same key always looks the same. */
export const toneForKey = (key) => {
  if (!key) return NEUTRAL_TONE;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return CATEGORY_TONES[Math.abs(hash) % CATEGORY_TONES.length];
};
