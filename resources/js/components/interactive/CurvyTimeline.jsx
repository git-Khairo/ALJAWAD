import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * Vertical scroll-driven curvy timeline.
 *
 * Props:
 *  - steps: [{ title, description, icon?, numberLabel? }]
 *  - rtl:   whether to flip node alignment (Arabic)
 *
 * Behaviour:
 *  - The S-curve SVG path draws itself as the user scrolls through the section.
 *  - A glowing galloping "rider" dot follows the path.
 *  - Step cards alternate sides and reveal as the path reaches them.
 */
export const CurvyTimeline = ({ steps = [], rtl = false }) => {
  const wrapRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start 70%', 'end 30%'],
  });

  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 22 });

  // Total path length is derived from the viewBox (see getTotalLength in browsers).
  // We compute using `pathLength=1` for a normalized sweep.
  const dashOffset = useTransform(progress, [0, 1], [1, 0]);

  // Layout params — viewBox is 800 wide, height scales with step count.
  const COLS = 800;
  const ROW_H = 240; // vertical spacing per step
  const TOP_PAD = 120;
  const BOTTOM_PAD = 120;
  const height = TOP_PAD + BOTTOM_PAD + Math.max(0, steps.length - 1) * ROW_H;

  // Node X coordinates alternate; we build an S-curve using smooth bezier commands.
  const leftX = 220;
  const rightX = 580;
  const nodes = steps.map((_, i) => ({
    x: i % 2 === 0 ? leftX : rightX,
    y: TOP_PAD + i * ROW_H,
  }));

  // Build a smooth bezier path through all nodes.
  const pathD = (() => {
    if (nodes.length === 0) return '';
    let d = `M ${nodes[0].x} ${nodes[0].y}`;
    for (let i = 1; i < nodes.length; i++) {
      const prev = nodes[i - 1];
      const cur = nodes[i];
      const midY = (prev.y + cur.y) / 2;
      // Cubic curve with horizontal control handles for a smooth S-shape
      d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
    }
    return d;
  })();

  // Each node also has its own progress threshold so we can reveal cards in sync.
  const nodeStops = nodes.map((_, i) => (i + 0.4) / nodes.length);

  return (
    <div ref={wrapRef} className="relative mx-auto max-w-5xl" dir={rtl ? 'rtl' : 'ltr'}>
      {/* ───── Mobile: simple stacked timeline ───── */}
      <div className="md:hidden relative ps-8">
        <div className="absolute top-0 bottom-0 start-3 w-px bg-primary/20" />
        <motion.div
          style={{ scaleY: progress }}
          className="absolute top-0 start-3 w-px bg-gradient-to-b from-primary via-primary/60 to-primary/0 origin-top shadow-[0_0_8px_hsl(195_65%_55%/0.9)]"
          aria-hidden
        />
        <div className="space-y-5">
          {steps.map((step, i) => (
            <MobileStep key={i} step={step} stop={nodeStops[i]} progress={progress} index={i} />
          ))}
        </div>
      </div>

      {/* ───── Desktop: curvy SVG timeline ───── */}
      <div className="hidden md:block">
      <svg
        viewBox={`0 0 ${COLS} ${height}`}
        className="absolute inset-x-0 top-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="curvy-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(195 85% 70%)" />
            <stop offset="60%" stopColor="hsl(195 65% 47%)" />
            <stop offset="100%" stopColor="hsl(195 65% 30%)" />
          </linearGradient>
          <filter id="curvy-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base rail (faint) */}
        <path
          d={pathD}
          stroke="hsl(195 65% 47% / 0.12)"
          strokeWidth="3"
          fill="none"
          pathLength="1"
          strokeLinecap="round"
        />
        {/* Animated progress rail */}
        <motion.path
          d={pathD}
          stroke="url(#curvy-grad)"
          strokeWidth="3"
          fill="none"
          pathLength="1"
          strokeDasharray="1"
          style={{ strokeDashoffset: dashOffset, filter: 'url(#curvy-glow)' }}
          strokeLinecap="round"
        />

        {/* Nodes along the curve */}
        {nodes.map((n, i) => (
          <NodeDot key={i} x={n.x} y={n.y} progress={progress} stop={nodeStops[i]} />
        ))}

        {/* Galloping follower that rides along the path */}
        <Follower pathD={pathD} progress={progress} />
      </svg>

      {/* Step cards placed absolutely over the SVG */}
      <div className="relative" style={{ height }}>
        {steps.map((step, i) => {
          const isLeft = i % 2 === 0;
          const yCenter = TOP_PAD + i * ROW_H;
          // Card sits on the *opposite* side of the dot for readability.
          const sideClass = isLeft ? 'left-[55%]' : 'right-[55%]';
          return (
            <StepCard
              key={i}
              step={step}
              stop={nodeStops[i]}
              progress={progress}
              style={{
                top: `${(yCenter / height) * 100}%`,
                transform: 'translateY(-50%)',
              }}
              sideClass={sideClass}
              index={i}
            />
          );
        })}
      </div>
      </div>
    </div>
  );
};

const MobileStep = ({ step, stop, progress, index }) => {
  const opacity = useTransform(progress, [stop - 0.1, stop + 0.05], [0.4, 1]);
  const y = useTransform(progress, [stop - 0.1, stop + 0.05], [12, 0]);
  const Icon = step.icon;
  return (
    <motion.div style={{ opacity, y }} className="relative">
      {/* Dot on the rail */}
      <div className="absolute -start-[1.7rem] top-3 flex items-center justify-center">
        <span className="absolute h-5 w-5 rounded-full bg-primary/20" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(195_65%_55%/0.9)]" />
      </div>
      <div className="glass rounded-2xl border border-primary/20 p-4 shadow-neon">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-extrabold shadow-neon">
            {Icon ? <Icon className="h-5 w-5" /> : index + 1}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const NodeDot = ({ x, y, progress, stop }) => {
  const scale = useTransform(progress, [stop - 0.05, stop], [0.4, 1]);
  const opacity = useTransform(progress, [stop - 0.08, stop], [0.2, 1]);
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r="14"
        fill="hsl(195 65% 47% / 0.12)"
        style={{ scale, opacity, transformOrigin: `${x}px ${y}px` }}
      />
      <motion.circle
        cx={x}
        cy={y}
        r="7"
        fill="hsl(195 85% 60%)"
        style={{ scale, opacity, filter: 'url(#curvy-glow)', transformOrigin: `${x}px ${y}px` }}
      />
    </g>
  );
};

/**
 * Uses a hidden <path> measured at runtime to produce a motion along-the-curve.
 * We approximate by using strokeDasharray trick with a circle follower.
 */
const Follower = ({ pathD, progress }) => {
  const pathRef = useRef(null);
  // Position is simply x/y of a circle driven by offset-path via SVG's <animateMotion> alternative
  // We use a simpler approach: clone the path as a motion-path using CSS isn't reliable across browsers on SVG,
  // so we set circle at progress * length using getPointAtLength() via a useMotionValueEvent.
  // For simplicity + perf we instead render a dot at the path end via a secondary path with dash-offset.
  // That yields an animated "head" that appears to ride the drawn line.
  return (
    <motion.path
      ref={pathRef}
      d={pathD}
      stroke="hsl(195 95% 75%)"
      strokeWidth="10"
      strokeLinecap="round"
      fill="none"
      pathLength="1"
      strokeDasharray="0.005 1"
      style={{ strokeDashoffset: useTransform(progress, (p) => 1 - p), filter: 'drop-shadow(0 0 10px hsl(195 85% 60% / 0.9))' }}
    />
  );
};

const StepCard = ({ step, stop, progress, style, sideClass, index }) => {
  const opacity = useTransform(progress, [stop - 0.1, stop + 0.05], [0, 1]);
  const y = useTransform(progress, [stop - 0.1, stop + 0.05], [30, 0]);
  const Icon = step.icon;
  return (
    <motion.div
      style={{ ...style, opacity, y }}
      className={`absolute ${sideClass} w-[40%] max-w-sm px-4`}
    >
      <div className="relative glass rounded-2xl border border-primary/20 p-5 shadow-neon">
        <div className="absolute -inset-px rounded-2xl pointer-events-none" style={{
          background: 'linear-gradient(135deg, hsl(195 65% 55% / 0.15), transparent 60%)',
        }} />
        <div className="relative flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-extrabold shadow-neon">
            {Icon ? <Icon className="h-5 w-5" /> : (step.numberLabel ?? index + 1)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base md:text-lg">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              {step.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CurvyTimeline;
