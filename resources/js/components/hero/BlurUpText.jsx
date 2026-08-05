import { motion } from 'framer-motion';

/**
 * The signature hero reveal: each unit of the headline rises from below while
 * a 12px blur resolves to zero, staggered ~35ms apart.
 *
 * Latin text is split per character. **Arabic is split per word** — Arabic is
 * cursive, and wrapping every letter in its own inline-block would break the
 * joining forms and render the headline as disconnected glyphs.
 */

const UNIT = {
  hidden: { opacity: 0, y: 50, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
  },
};

export const BlurUpText = ({
  text,
  byChar = true,
  stagger = 0.035,
  delay = 0,
  className = '',
}) => {
  const source = String(text ?? '');
  // Keep the whitespace in the token list so words stay separated; spaces are
  // rendered as plain spans and therefore don't consume a stagger slot.
  const tokens = byChar ? Array.from(source) : source.split(/(\s+)/);

  return (
    <motion.span
      className={`inline-block ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {tokens.map((token, i) =>
        token.trim() === '' ? (
          <span key={i} style={{ whiteSpace: 'pre' }}>{token}</span>
        ) : (
          <motion.span
            key={i}
            variants={UNIT}
            className="inline-block will-change-[transform,filter]"
          >
            {token}
          </motion.span>
        )
      )}
    </motion.span>
  );
};

export default BlurUpText;
