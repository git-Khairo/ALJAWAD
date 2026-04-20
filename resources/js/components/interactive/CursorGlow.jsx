import { useEffect, useRef } from 'react';

/**
 * Soft cursor-following radial glow. Sits above the page background, below UI.
 * Disabled on touch devices where it adds no value.
 */
export const CursorGlow = () => {
  const ref = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    const isCoarse = matchMedia('(pointer: coarse)').matches;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isCoarse || reduced) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let dx = targetX;
    let dy = targetY;
    let raf = 0;
    let dirty = false;

    const onMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      dirty = true;
    };
    const onDown = () => ref.current?.classList.add('scale-[0.85]');
    const onUp = () => ref.current?.classList.remove('scale-[0.85]');

    const loop = () => {
      if (dirty || Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5) {
        x += (targetX - x) * 0.12;
        y += (targetY - y) * 0.12;
        dx += (targetX - dx) * 0.3;
        dy += (targetY - dy) * 0.3;
        if (ref.current) ref.current.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
        if (dotRef.current) dotRef.current.style.transform = `translate3d(${dx - 6}px, ${dy - 6}px, 0)`;
        dirty = Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className="pointer-events-none fixed left-0 top-0 z-[1] h-[360px] w-[360px] rounded-full transition-transform duration-200 ease-out will-change-transform hidden md:block"
        style={{
          background:
            'radial-gradient(circle at center, hsl(195 85% 60% / 0.16) 0%, hsl(195 85% 60% / 0.05) 35%, transparent 70%)',
        }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[999] hidden h-3 w-3 rounded-full bg-primary/80 shadow-[0_0_12px_hsl(195_65%_55%/0.8)] mix-blend-screen md:block"
      />
    </>
  );
};

export default CursorGlow;
