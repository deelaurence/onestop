import { useEffect, useRef } from 'react';

export default function CustomCursor() {
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

    window.addEventListener('mousemove', onMove, { passive: true });

    const interactives = document.querySelectorAll('a, button, .portfolio-item');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      running = false;
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onMove);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return (
    <>
      <div ref={dot} className="cursor-dot" />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}
