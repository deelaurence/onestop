import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isReducedPerformance } from '../lib/performance';
import DarkroomFallback from './DarkroomFallback';

const DarkroomCanvas = lazy(() => import('./DarkroomCanvas'));

gsap.registerPlugin(ScrollTrigger);

export default function DarkroomGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const reduced = isReducedPerformance();
  const [canvasActive, setCanvasActive] = useState(reduced);

  useEffect(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    if (!section || !overlay) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
          pin: '.darkroom-viewport',
          anticipatePin: 1,
        },
      });

      tl.fromTo(
        overlay,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 2, ease: 'power2.out' },
        0
      );
      tl.to(
        overlay,
        { opacity: 0, y: -20, duration: 2, ease: 'power1.in' },
        3
      );
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (reduced) return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCanvasActive(entry.isIntersecting),
      { rootMargin: '50% 0px 50% 0px', threshold: 0 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <section
      className={`darkroom-section${reduced ? ' darkroom-section--lite' : ''}`}
      ref={sectionRef}
    >
      <div className="darkroom-viewport">
        {reduced ? (
          <DarkroomFallback />
        ) : canvasActive ? (
          <Suspense fallback={<div className="darkroom-canvas-placeholder" />}>
            <DarkroomCanvas />
          </Suspense>
        ) : (
          <div className="darkroom-canvas-placeholder" />
        )}

        <div className="darkroom-overlay" ref={overlayRef}>
          <span className="darkroom-label">The Darkroom</span>
          <h2>
            Capturing a <em>Global</em> Narrative
          </h2>
        </div>

        <div className="darkroom-scroll-hint">
          <span>Scroll to drift</span>
          <div className="darkroom-scroll-line" />
        </div>
      </div>
    </section>
  );
}
