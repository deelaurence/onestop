import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import heroImg from '../assets/hero.jpg';
import weddingImg from '../assets/wedding.jpg';
import galleryPortrait from '../assets/gallery_portrait.png';
import galleryWedding from '../assets/gallery_wedding.png';
import galleryEvent from '../assets/gallery_event.png';

gsap.registerPlugin(ScrollTrigger);

const FRAMES = [
  { src: heroImg, x: '-28%', y: '8%', rotate: -3, depth: 0 },
  { src: galleryPortrait, x: '22%', y: '18%', rotate: 4, depth: 1 },
  { src: weddingImg, x: '-18%', y: '32%', rotate: 2, depth: 2 },
  { src: galleryEvent, x: '26%', y: '46%', rotate: -5, depth: 3 },
  { src: galleryWedding, x: '-24%', y: '58%', rotate: 3, depth: 4 },
  { src: heroImg, x: '16%', y: '70%', rotate: -2, depth: 5 },
  { src: galleryPortrait, x: '-12%', y: '82%', rotate: 5, depth: 6 },
];

export default function DarkroomFallback() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = document.querySelector('.darkroom-section');
    const frames = containerRef.current?.querySelectorAll<HTMLElement>('.darkroom-fallback-frame');
    if (!section || !frames?.length) return;

    const ctx = gsap.context(() => {
      frames.forEach((frame, i) => {
        const depth = FRAMES[i]?.depth ?? i;
        gsap.fromTo(
          frame,
          { opacity: 0.15, scale: 0.82 },
          {
            opacity: 1,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: `top+=${depth * 12}% top`,
              end: `top+=${depth * 12 + 28}% top`,
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
            start: `top+=${depth * 12 + 30}% top`,
            end: `top+=${depth * 12 + 50}% top`,
            scrub: 1.5,
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <div className="darkroom-fallback" ref={containerRef} aria-hidden="true">
      {FRAMES.map((frame, i) => (
        <figure
          key={i}
          className="darkroom-fallback-frame"
          style={{
            left: frame.x,
            top: frame.y,
            transform: `rotate(${frame.rotate}deg)`,
          }}
        >
          <img src={frame.src} alt="" loading="lazy" decoding="async" />
        </figure>
      ))}
    </div>
  );
}
