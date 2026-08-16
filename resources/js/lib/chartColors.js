/**
 * Chart colours.
 *
 * Every colour a chart draws comes from here, and every value resolves to a
 * CSS variable defined in resources/css/app.css. That keeps the palette in
 * one place and makes it follow the theme without any JS.
 *
 * `var()` resolves inside SVG presentation attributes (`fill="..."`,
 * `stroke="..."`) as well as inline styles, which is how recharts applies
 * these, so the strings below can be handed straight to a chart.
 *
 * Two separate vocabularies, and mixing them is the mistake to avoid:
 *
 *   SERIES     categories with no inherent direction: expense types, payment
 *              methods, departments. Use `seriesColor(i)` or CHART_SERIES.
 *   SEMANTIC   direction and state: up/down, revenue/expense, over/under
 *              budget. Use UP / DOWN / WARN.
 *
 * Drawing a category in the "down" red makes it read as a loss; drawing a
 * loss in series-4 jade makes it read as a category. Pick deliberately.
 */

/* ── Categorical ───────────────────────────────────────────────────────── */

export const CHART_SERIES = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
];

/** Stable colour for series index `i`, wrapping past the end of the ramp. */
export const seriesColor = (i) => CHART_SERIES[Math.abs(Number(i) || 0) % CHART_SERIES.length];

/* ── Semantic ──────────────────────────────────────────────────────────── */

export const UP = 'hsl(var(--chart-up))';
export const DOWN = 'hsl(var(--chart-down))';
export const WARN = 'hsl(var(--warn))';
export const NEUTRAL = 'hsl(var(--fg-faint))';
export const BRAND = 'hsl(var(--primary))';

/* ── Chrome ────────────────────────────────────────────────────────────── */

export const CHART_GRID = 'hsl(var(--rule))';
export const CHART_AXIS = 'hsl(var(--fg-muted))';

/** Spread onto a recharts <Tooltip contentStyle={...}>. */
export const CHART_TOOLTIP = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--rule-strong))',
  borderRadius: '3px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

/** Common <XAxis>/<YAxis> tick styling. */
export const AXIS_TICK = { fontSize: 11, fill: CHART_AXIS };
