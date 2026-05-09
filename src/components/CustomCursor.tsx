import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      gsap.to(dot.current, { x: e.clientX, y: e.clientY, duration: 0.05 });
      gsap.to(ring.current, { x: e.clientX, y: e.clientY, duration: 0.25, ease: 'power2.out' });
    };

    const onEnter = () => {
      dot.current?.classList.add('hovering');
      ring.current?.classList.add('hovering');
    };
    const onLeave = () => {
      dot.current?.classList.remove('hovering');
      ring.current?.classList.remove('hovering');
    };

    window.addEventListener('mousemove', onMove);

    const interactives = document.querySelectorAll('a, button, .portfolio-item');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
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
