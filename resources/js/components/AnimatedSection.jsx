import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll reveals.
 *
 * Three rules this had to satisfy, in order:
 *
 * 1. Content must never be permanently invisible. The previous version drove
 *    reveals with framer-motion's `whileInView`, which starts at opacity 0 and
 *    depends on requestAnimationFrame to ever reach 1. When rAF is throttled
 *    (background tab, battery saver, a busy main thread on the mid-range
 *    Android most of our traffic is on) the page renders blank. So: an
 *    IntersectionObserver triggers the reveal, a timeout reveals regardless if
 *    the observer never fires, and the reveal itself is a CSS animation with
 *    `fill-mode: both`, which is time-driven rather than frame-driven.
 *
 * 2. Transform and opacity only. The previous version tweened
 *    `filter: blur(10px)` on every section, forcing a full repaint per frame.
 *
 * 3. Short and quick. A reveal should read as the page settling, not as a
 *    slideshow transition.
 *
 * The exported API is unchanged, so the pages already importing these keep
 * working.
 */

const SAFETY_MS = 1500;

function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -60px 0px' },
    );
    observer.observe(el);

    // Nothing on this site is allowed to stay invisible because an observer
    // did not fire.
    const safety = setTimeout(() => {
      setShown(true);
      observer.disconnect();
    }, SAFETY_MS);

    return () => {
      observer.disconnect();
      clearTimeout(safety);
    };
  }, []);

  return [ref, shown];
}

export const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={cn(shown ? 'animate-rise' : 'opacity-0', className)}
      style={shown && delay ? { animationDelay: `${delay * 1000}ms` } : undefined}
    >
      {children}
    </div>
  );
};

const StaggerCtx = createContext({ shown: true, step: 0.05 });

export const StaggerContainer = ({ children, className = '', delay = 0.05, initialDelay = 0 }) => {
  const [ref, shown] = useReveal();

  // Index injected here rather than counted inside the child, so it survives
  // StrictMode double-rendering.
  let i = 0;
  const indexed = Children.map(children, (child) =>
    isValidElement(child) ? cloneElement(child, { __index: i++ }) : child,
  );

  return (
    <StaggerCtx.Provider value={{ shown, step: delay, initialDelay }}>
      <div ref={ref} className={className}>
        {indexed}
      </div>
    </StaggerCtx.Provider>
  );
};

export const StaggerItem = ({ children, className = '', __index = 0 }) => {
  const { shown, step, initialDelay } = useContext(StaggerCtx);
  return (
    <div
      className={cn(shown ? 'animate-rise' : 'opacity-0', className)}
      style={shown ? { animationDelay: `${(initialDelay + __index * step) * 1000}ms` } : undefined}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
