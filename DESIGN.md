# AlJawad Design System

Reference implementation: `resources/css/app.css` and `tailwind.config.js`.
This file explains the intent so the next change stays coherent.

## What is fixed and what changed

**Fixed, by direction.** The palette and the typeface are the brand's and are
not up for redesign: the teal/navy HSL scale, set in Cairo.

**Changed.** Everything structural. The previous build layered decoration on
top of the palette (gradient text on every heading, neon glow on every
surface, glass panels, animated grid backgrounds, radar sweeps, scanlines,
3D tilt cards, magnetic buttons, a floating 3D horse). All of that is gone.
The colour now does the work that the effects were doing.

That distinction is the whole design brief: **same colours, different
craft.** Teal on navy is a common enough combination that the only thing
separating a credible trading desk from a signal-group scam is the
discipline of everything around it.

## Color

Tokens are bare HSL components so Tailwind opacity modifiers work:

```css
--primary: 195 65% 47%;   /* consumed as hsl(var(--primary) / <alpha-value>) */
```

### Brand tokens, unchanged

| Token | HSL | Role |
|---|---|---|
| `--background` | `210 30% 8%` | page ground |
| `--card` | `210 25% 11%` | raised panel |
| `--foreground` | `200 20% 92%` | body and headline |
| `--muted-foreground` | `200 15% 55%` | secondary text |
| `--primary` / `--accent` | `195 65% 47%` | the teal |
| `--border` | `210 20% 18%` | hairline |
| `--chart-up` | `145 70% 50%` | price rising |
| `--chart-down` | `0 72% 55%` | price falling |

### Structural aliases

Added so component code can name the role a surface plays instead of guessing
between `card`, `muted` and `secondary`. **No new colour is introduced.**

`--surface` / `--surface-raised` / `--surface-sunken`, `--fg` / `--fg-muted` /
`--fg-faint`, `--rule` / `--rule-strong`, `--brand` / `--brand-hover` /
`--brand-wash`.

Only `--surface-sunken` (`210 22% 13%`), `--fg-faint` (`200 12% 40%`) and
`--rule-strong` (`210 20% 26%`) are new values, and each is an interpolation
inside the existing navy ramp, added because the original scale had no step
between "card" and "border" to build a hierarchy with.

### Themes

There is no light theme, and the UI no longer claims one. The brand palette
is dark by definition, so a "Light" option that rendered dark was a control
that lied about what it did.

What the `.dark` class provides instead is **Dim**: the ground drops from
`210 30% 8%` to `210 32% 4%` and the ink softens from `200 20% 92%` to
`200 16% 86%`, for desk work at night. The two states differed by two points
of lightness before, which nobody could see.

If a genuine light theme is ever wanted, it means designing a second palette,
not flipping these values.

### Charts

Charts are the one place that legitimately needs more colours than the brand
has: a pie of eight expense categories cannot be drawn in teal. The ramp lives
in `--chart-1` through `--chart-8` and is consumed through
`resources/js/lib/chartColors.js`, which is the only place a chart colour
should ever come from.

Two vocabularies, and mixing them is the mistake to avoid:

| | Use for | Source |
|---|---|---|
| **Series** | categories with no direction: expense types, payment methods, departments | `CHART_SERIES`, `seriesColor(i)` |
| **Semantic** | direction and state: up/down, revenue/expense, over budget | `UP`, `DOWN`, `WARN`, `NEUTRAL` |

Drawing a category in the "down" red makes it read as a loss; drawing a loss
in series-4 jade makes it read as a category.

The ramp is anchored on the brand teal, ordered so adjacent indexes contrast
(series 1 and 2 sit together far more often than 1 and 6), and held in a
narrow lightness band so no series disappears against the navy.

`--chart-2` is lemon rather than amber on purpose: at 38deg it sat within a
few RGB points of `--warn`, so an ordinary category read as a warning state.
It is now 14deg yellower and 13 points lighter.

`var()` resolves inside SVG presentation attributes as well as inline styles,
which is how recharts applies these, so the CSS variables can be handed
straight to a chart and the palette follows the theme with no JS.

### Rules

- Teal marks what is **live, actionable, or the firm's own voice**. It is not
  a decoration, and it does not appear on every heading. Two buttons on a
  screen may be teal; six may not.
- Green and red belong to price movement and financial state only. Using
  either as a brand colour makes the interface lie about direction.
- No colour is applied by gradient, and never to text.

## Typography

Cairo, as before, across both scripts. Hierarchy comes from **scale and
weight**, never from colour alone and never from a gradient.

| Step | Size |
|---|---|
| `display-xs` | 1.75rem |
| `display-sm` | 2.25rem |
| `display-md` | 3rem |
| `display-lg` | 4rem |
| `display-xl` | 5rem |

Display steps are separate from the standard scale so headline sizing never
leaks into dashboard chrome. Each step is at least 1.25x the one below it.

### Rules

- Body copy caps at the `--measure` token: 68ch in Latin, 62ch in Arabic,
  which sets denser per character.
- Numbers are always mono and always tabular. A price that reflows as it
  ticks is a broken price.
- Arabic is never letter-spaced. `app.css` enforces this globally because the
  `tracking-*` utilities would otherwise win on source order, and tracking
  breaks the cursive joins. Explicitly `dir="ltr"` subtrees opt out.

## Layout

- Rules and negative space separate content. Cards are the exception, not the
  container of first resort. Nested cards are always wrong.
- Sections alternate rhythm rather than repeating one padding value.
- Asymmetry is the default: content sits on a 12 column grid but is rarely
  centred, and the measure changes between bands.
- No three-column grid of identical icon cards. The services section is a
  numbered index with the figure hanging in the margin; the journal section
  gives the lead article weight and sets the rest as ruled entries.

## Elevation

Shadows are tinted to the navy ground, kept tight, and never coloured. Most
surfaces separate with a 1px rule and a value step instead of a shadow.

## Motion

- Ease out with `cubic-bezier(0.25, 1, 0.5, 1)` (quart) or
  `cubic-bezier(0.16, 1, 0.3, 1)` (expo). No bounce, no elastic.
- 120ms micro, 200ms standard, 320ms enter, 480ms section reveal.
- Transform and opacity only. Layout properties and `filter` are never
  animated: the previous `AnimatedSection` tweened `filter: blur(10px)` on
  every section, which forces a full repaint per frame.
- **Above-the-fold content never depends on a running animation loop to be
  visible.** The hero enters with a CSS animation using `fill-mode: both`, so
  the final state is painted even when requestAnimationFrame is throttled by
  a busy main thread or a background tab. `prefers-reduced-motion` collapses
  it to that state outright.

## Banned

Not to be reintroduced: gradient text, coloured glow of any kind,
glassmorphism as a default surface, animated grid backgrounds, radar sweeps,
scanlines, flicker, blur blobs, cursor glow, 3D tilt cards, magnetic buttons,
the big-gradient-number stat row, and identical card grids.

The legacy class names still resolve, redefined in `app.css` as flat
equivalents in the same palette, so dashboards that have not been rebuilt yet
degrade gracefully instead of rendering unstyled. They are a compatibility
shim. Delete the class from the markup as each surface is rebuilt.

## Honesty constraints

Design decisions that follow from PRODUCT.md rather than from taste:

- The market tape shows **real quotes only**. The previous build jittered
  prices with `Math.random()` between fetches so the tape "felt alive"; a firm
  whose pitch is that it does not mislead cannot invent price movement. When a
  market is closed, the tape sits still.
- Figures on the homepage are database-backed or factual. The hardcoded "98%
  client satisfaction" that nothing measured has been removed.
- The risk disclaimer is set at body size in the footer, not shrunk to 60%
  opacity micro-type.
