import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Slim gradient scroll progress bar pinned to the top of the viewport.
 */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.35,
  });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] bg-gradient-to-r from-primary/0 via-primary to-primary/0 shadow-[0_0_14px_hsl(195_65%_55%/0.7)]"
    />
  );
};

export default ScrollProgress;
