import { motion } from 'framer-motion';

const directionMap = {
  up: { y: 48, x: 0 },
  down: { y: -48, x: 0 },
  left: { x: 48, y: 0 },
  right: { x: -48, y: 0 },
  none: { x: 0, y: 0 },
};

const ease = [0.22, 1, 0.36, 1];

export const AnimatedSection = ({ children, className = '', delay = 0, direction = 'up', blur = true }) => {
  const d = directionMap[direction] ?? directionMap.up;
  return (
    <motion.div
      initial={{ opacity: 0, ...d, filter: blur ? 'blur(10px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.85, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer = ({ children, className = '', delay = 0.06, initialDelay = 0 }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: delay, delayChildren: initialDelay } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
      visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.7, ease },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);
