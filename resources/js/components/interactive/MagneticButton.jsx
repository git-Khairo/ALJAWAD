import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Magnetic wrapper: children subtly track the cursor inside a target box.
 * Pair with <Button> or a <Link> for an interactive CTA feel.
 */
export const MagneticButton = ({ children, className = '', strength = 0.35, as = 'div' }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });
  const rotateX = useTransform(sy, [-30, 30], [6, -6]);
  const rotateY = useTransform(sx, [-30, 30], [-6, 6]);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * strength);
    y.set(relY * strength);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Comp = motion[as] || motion.div;
  return (
    <Comp
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy, rotateX, rotateY, transformPerspective: 600 }}
      className={`inline-block ${className}`}
    >
      {children}
    </Comp>
  );
};

export default MagneticButton;
