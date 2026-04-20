/**
 * Stylized galloping horse silhouette that matches the AlJawad logo spirit.
 * Designed to sit on a dark hero block with a teal→light-teal gradient fill.
 * All paths are original, single-stroke optimized, and use currentColor where useful.
 */
export const HorseSilhouette = ({ className = '', accent = 'url(#horse-g)' }) => (
  <svg
    viewBox="0 0 640 420"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="horse-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(195 85% 70%)" />
        <stop offset="55%" stopColor="hsl(195 65% 47%)" />
        <stop offset="100%" stopColor="hsl(210 55% 22%)" />
      </linearGradient>
      <linearGradient id="horse-mane" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(195 95% 75%)" />
        <stop offset="100%" stopColor="hsl(195 65% 47%)" />
      </linearGradient>
      <linearGradient id="horse-trail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(195 65% 47% / 0)" />
        <stop offset="100%" stopColor="hsl(195 65% 55% / 0.9)" />
      </linearGradient>
      <radialGradient id="horse-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="hsl(195 65% 55% / 0.35)" />
        <stop offset="100%" stopColor="hsl(195 65% 55% / 0)" />
      </radialGradient>
    </defs>

    {/* Soft glow disc behind the horse */}
    <circle cx="380" cy="210" r="220" fill="url(#horse-glow)" />

    {/* Motion trail / speed streaks */}
    <path
      d="M10 260 C 90 252, 160 258, 230 248"
      stroke="url(#horse-trail)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M40 290 C 110 282, 170 290, 230 278"
      stroke="url(#horse-trail)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      opacity="0.55"
    />
    <path
      d="M20 320 C 100 316, 160 320, 230 308"
      stroke="url(#horse-trail)"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />

    {/* Main horse body (galloping silhouette) */}
    <g fill={accent} stroke="hsl(195 85% 75%)" strokeWidth="1" strokeLinejoin="round">
      {/* Body + neck + head */}
      <path
        d="
          M 250 250
          C 242 232, 248 212, 268 202
          C 280 196, 292 196, 304 198
          C 314 186, 326 174, 344 168
          C 332 150, 328 136, 336 122
          C 344 110, 360 104, 376 106
          C 390 96, 410 90, 432 96
          C 454 102, 466 118, 470 134
          C 476 132, 484 134, 488 142
          C 492 152, 484 160, 474 158
          C 472 170, 468 180, 458 188
          L 462 208
          C 474 218, 482 232, 482 248
          C 482 266, 472 280, 458 286
          C 452 296, 442 306, 434 316
          L 446 330
          C 452 336, 450 346, 444 350
          C 438 354, 430 350, 428 344
          L 416 326
          C 402 330, 388 326, 378 316
          C 366 326, 354 336, 340 340
          L 352 358
          C 358 364, 354 372, 346 372
          C 338 372, 334 366, 332 360
          L 322 338
          C 310 336, 302 332, 294 326
          C 284 340, 270 350, 254 352
          L 266 374
          C 270 380, 266 388, 258 388
          C 250 388, 246 382, 244 376
          L 234 354
          C 218 356, 200 352, 188 340
          C 176 330, 172 316, 174 304
          C 162 296, 156 284, 158 270
          C 160 258, 170 250, 184 248
          C 200 246, 220 252, 238 254
          Z"
      />
    </g>

    {/* Mane accent (lighter teal) */}
    <path
      d="
        M 376 106
        C 360 92, 346 86, 332 94
        C 320 100, 316 116, 322 130
        C 318 144, 326 158, 340 164
        C 334 150, 342 136, 358 130
        C 346 120, 356 108, 372 112 Z"
      fill="url(#horse-mane)"
      opacity="0.95"
    />

    {/* Eye */}
    <circle cx="434" cy="128" r="3" fill="hsl(210 30% 6%)" />
    <circle cx="435" cy="127" r="1" fill="hsl(195 85% 85%)" />

    {/* Floating candle bars (echoing the logo) */}
    <g>
      <rect x="492" y="60"  width="10" height="34" rx="2" fill="hsl(145 70% 55%)" opacity="0.9" />
      <line x1="497" y1="52" x2="497" y2="104" stroke="hsl(145 70% 55%)" strokeWidth="1.5" opacity="0.9" />
      <rect x="512" y="44"  width="10" height="48" rx="2" fill="hsl(0 72% 55%)" opacity="0.9" />
      <line x1="517" y1="36" x2="517" y2="100" stroke="hsl(0 72% 55%)" strokeWidth="1.5" opacity="0.9" />
      <rect x="532" y="68"  width="10" height="28" rx="2" fill="hsl(145 70% 55%)" opacity="0.9" />
      <line x1="537" y1="60" x2="537" y2="106" stroke="hsl(145 70% 55%)" strokeWidth="1.5" opacity="0.9" />
      <rect x="552" y="50"  width="10" height="40" rx="2" fill="hsl(145 70% 55%)" opacity="0.9" />
      <line x1="557" y1="42" x2="557" y2="100" stroke="hsl(145 70% 55%)" strokeWidth="1.5" opacity="0.9" />
      <rect x="572" y="74"  width="10" height="24" rx="2" fill="hsl(0 72% 55%)" opacity="0.9" />
      <line x1="577" y1="66" x2="577" y2="108" stroke="hsl(0 72% 55%)" strokeWidth="1.5" opacity="0.9" />
    </g>
  </svg>
);

export default HorseSilhouette;
