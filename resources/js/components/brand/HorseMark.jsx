/**
 * The AlJawad mark: الجواد, the noble steed.
 *
 * A horse's head cut as a single flat shape, in the spirit of an engraved
 * colophon. Drawn in `currentColor` so it can be set in ink on paper, paper
 * on ink, or brand, at any size, for a few hundred bytes.
 *
 * Deliberately a head rather than the full galloping figure of the raster
 * logo: at 28px in a masthead a full body collapses into an unreadable blob,
 * and the masthead is where this mark lives most of the time.
 */
export const HorseMark = ({ className = '', title }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : 'true'}
    aria-label={title}
  >
    {title && <title>{title}</title>}
    <g fill="currentColor">
      {/* Head, ears, jaw and neck as one closed silhouette. */}
      <path
        d="
          M17 54
          C 18 46, 23 39, 31 34
          L 43 27
          L 45 9
          C 45 7, 48 6, 49 8
          L 58 24
          L 65 7
          C 66 5, 69 5, 70 8
          L 76 27
          C 83 32, 88 40, 90 49
          C 93 62, 96 79, 98 103
          C 98 105, 97 106, 95 106
          L 74 106
          C 72 106, 71 105, 71 103
          C 70 88, 64 76, 53 68
          C 45 63, 36 61, 27 62
          C 22 63, 17 60, 17 54
          Z
        "
      />
      {/* Mane, cut away from the neck so the silhouette reads as a horse
          and not a shoe at small sizes. */}
      <path
        d="M78 30 C 86 40, 90 52, 92 66 L 84 62 C 82 50, 79 40, 74 32 Z"
        opacity="0.45"
      />
      {/* Ground rule: the tape it runs on. */}
      <rect x="14" y="110" width="92" height="5" rx="1" />
    </g>
    {/* Eye and nostril punched through in the page colour. */}
    <circle cx="48" cy="43" r="3.4" fill="hsl(var(--background))" />
    <circle cx="23" cy="52" r="2.2" fill="hsl(var(--background))" />
  </svg>
);

export default HorseMark;
