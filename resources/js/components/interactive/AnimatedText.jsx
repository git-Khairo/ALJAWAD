import { motion } from 'framer-motion';

/**
 * Animates text per-word with a smooth stagger + blur reveal.
 * Works for RTL as well since we render each word as a motion.span.
 */
export const AnimatedText = ({ text, className = '', delay = 0, as: Tag = 'span', stagger = 0.06 }) => {
  const words = String(text ?? '').split(/(\s+)/);
  const MotionTag = motion[Tag] || motion.span;
  return (
    <MotionTag
      className={`inline-block ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {words.map((w, i) =>
        /\s+/.test(w) ? (
          <span key={i}>{w}</span>
        ) : (
          <motion.span
            key={i}
            className="inline-block will-change-transform"
            variants={{
              hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            {w}
          </motion.span>
        )
      )}
    </MotionTag>
  );
};

export default AnimatedText;
