import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function CustomCursor() {
  const location = useLocation();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);

  useEffect(() => {
    const dotEl = dot.current;
    const ringEl = ring.current;
    if (!dotEl || !ringEl) return;

    let running = true;

    const tick = () => {
      if (!running) return;

      current.current.x += (target.current.x - current.current.x) * 0.22;
      current.current.y += (target.current.y - current.current.y) * 0.22;
      ringEl.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;

      const settled =
        Math.abs(target.current.x - current.current.x) < 0.5 &&
        Math.abs(target.current.y - current.current.y) < 0.5;

      rafId.current = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      dotEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (!rafId.current) rafId.current = requestAnimationFrame(tick);
    };

    const onEnter = () => {
      dotEl.classList.add('hovering');
      ringEl.classList.add('hovering');
    };
    const onLeave = () => {
      dotEl.classList.remove('hovering');
      ringEl.classList.remove('hovering');
    };

    const onPointerOver = (e: Event) => {
      const el = e.target as Element | null;
      if (el?.closest('a, button, .portfolio-item')) onEnter();
    };

    const onPointerOut = (e: Event) => {
      const el = e.target as Element | null;
      const related = (e as MouseEvent).relatedTarget as Element | null;
      if (el?.closest('a, button, .portfolio-item') && !related?.closest('a, button, .portfolio-item')) {
        onLeave();
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onPointerOver, { passive: true });
    document.addEventListener('mouseout', onPointerOut, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onPointerOver);
      document.removeEventListener('mouseout', onPointerOut);
    };
  }, [location.pathname]);

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}
