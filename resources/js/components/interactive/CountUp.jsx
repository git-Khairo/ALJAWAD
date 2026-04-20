import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Scroll-triggered number counter. Accepts an optional suffix (%, +, k).
 */
export const CountUp = ({ end, duration = 1.8, suffix = '', prefix = '', className = '' }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(end * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(end);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  return (
    <motion.span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </motion.span>
  );
};

export default CountUp;
