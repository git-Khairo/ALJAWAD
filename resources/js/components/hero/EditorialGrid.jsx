import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * The editorial scaffolding that sits over the hero: a hairline rule under the
 * header, five vertical hairlines, and small dots that drift up and down the
 * lines as the page scrolls (alternating direction, staggered speeds).
 *
 * Purely decorative — `pointer-events-none` throughout, except the story
 * dashes, which double as the slide indicator.
 */

/** One drifting dot. Wraps around 0–100% of its line, like a loop of film. */
const GridDot = ({ index, progress }) => {
  const top = useTransform(progress, (v) => {
    const startY = (index * 17) % 80 + 10;
    let speed = 90 + (index * 55) % 180;
    if (index % 2 === 0) speed = -speed;
    const y = startY + v * speed;
    return `${((y % 100) + 100) % 100}%`;
  });

  return (
    <motion.span
      style={{ top }}
      className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/50 shadow-[0_0_6px_hsl(195_85%_60%/0.5)]"
    />
  );
};

/**
 * One segment of the stories-style progress column. Each dash owns a quarter of
 * the page and fills as the reader passes through it.
 */
const StoryDash = ({ index, segments, progress }) => {
  const height = useTransform(progress, (v) => {
    const start = index / segments;
    const end = (index + 1) / segments;
    const t = (v - start) / (end - start);
    return `${Math.max(0, Math.min(1, t)) * 100}%`;
  });

  return (
    <div className="h-10 w-0.5 overflow-hidden rounded-full bg-white/15">
      <motion.span
        style={{ height }}
        className="block w-full rounded-full bg-primary shadow-[0_0_8px_hsl(195_85%_60%/0.8)]"
      />
    </div>
  );
};

export const EditorialGrid = ({ segments = 4 }) => {
  const { scrollYProgress } = useScroll();

  return (
    <>
      {/* Hairline rule sitting just under the site header */}
      <div className="pointer-events-none absolute inset-x-0 top-[70px] z-[3] hidden h-px bg-white/10 md:block" />

      {/* Five vertical hairlines */}
      <div className="pointer-events-none absolute inset-y-0 inset-x-10 z-[3] hidden justify-between md:flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`relative w-px bg-white/10 ${i === 2 ? 'mt-[70px] h-[calc(100%-70px)]' : 'h-full'}`}
          >
            <GridDot index={i * 2} progress={scrollYProgress} />
            <GridDot index={i * 2 + 1} progress={scrollYProgress} />

            {/* The last line carries the stories-style page scroll progress */}
            {i === 4 && (
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-3">
                {Array.from({ length: segments }).map((_, s) => (
                  <StoryDash key={s} index={s} segments={segments} progress={scrollYProgress} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default EditorialGrid;
