import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PORTFOLIO_ITEMS } from '../data/portfolio';

gsap.registerPlugin(ScrollTrigger);

const FRAMES = [
  PORTFOLIO_ITEMS.find((i) => i.id === 'wedding-couple-embrace-forest-portrait'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'portrait-woman-formal-gele-lace-gown-full'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'wedding-ceremony-outdoor-arch-officiant'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'school-panorama-students-staff-turf'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'studio-portrait-couple-lift-playful'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'commercial-food-jollof-rice-chicken'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'wedding-reception-first-dance'),
].filter(Boolean) as typeof PORTFOLIO_ITEMS;

const FRAME_LAYOUT = [
  { x: '-28%', y: '8%', rotate: -3 },
  { x: '22%', y: '18%', rotate: 4 },
  { x: '-18%', y: '32%', rotate: 2 },
  { x: '26%', y: '46%', rotate: -5 },
  { x: '-24%', y: '58%', rotate: 3 },
  { x: '16%', y: '70%', rotate: -2 },
  { x: '-12%', y: '82%', rotate: 5 },
];

export default function DarkroomFallback() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.querySelector('.darkroom-section');
    const frames = containerRef.current?.querySelectorAll<HTMLElement>('.darkroom-fallback-frame');
    if (!section || !frames?.length) return;

    const ctx = gsap.context(() => {
      frames.forEach((frame, i) => {
        gsap.fromTo(
          frame,
          { opacity: 0.15, scale: 0.82 },
          {
            opacity: 1,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: `top+=${i * 12}% top`,
              end: `top+=${i * 12 + 28}% top`,
              scrub: 1.5,
            },
          }
        );
        gsap.to(frame, {
          opacity: 0.2,
          scale: 0.88,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: `top+=${i * 12 + 30}% top`,
            end: `top+=${i * 12 + 50}% top`,
            scrub: 1.5,
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div className="darkroom-fallback" ref={containerRef} aria-hidden="true">
      {FRAMES.map((item, i) => {
        const layout = FRAME_LAYOUT[i] ?? FRAME_LAYOUT[0];
        return (
          <figure
            key={item.id}
            className="darkroom-fallback-frame"
            style={{
              left: layout.x,
              top: layout.y,
              transform: `rotate(${layout.rotate}deg)`,
            }}
          >
            <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
          </figure>
        );
      })}
    </div>
  );
}
