import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * Wraps content so that it translates / scales as the user scrolls.
 * Pass a `speed` value between -1 and 1 to control drift distance.
 */
export const Parallax = ({ children, speed = 0.25, className = '', scale = false }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 140, -speed * 140]);
  const s = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1, scale ? 1.05 : 1]);
  const o = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.6, 1, 1, 0.6]);
  return (
    <motion.div
      ref={ref}
      style={{ y, scale: scale ? s : undefined, opacity: o }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScrollReveal = ({ children, className = '', delay = 0, y = 32 }) => (
  <motion.div
    initial={{ opacity: 0, y, filter: 'blur(8px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default Parallax;
