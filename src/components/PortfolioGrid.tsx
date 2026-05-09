import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from '../assets/hero.jpg';
import weddingImg from '../assets/wedding.jpg';
import galleryPortrait from '../assets/gallery_portrait.png';
import galleryWedding from '../assets/gallery_wedding.png';
import galleryEvent from '../assets/gallery_event.png';

gsap.registerPlugin(ScrollTrigger);

/*
 * `depth` controls the starting blur (in px).
 * All columns begin blurred and rack-focus into clarity
 * as you scroll through. The deeper the depth, the later
 * they come into focus — like a real lens pulling focus
 * across planes.
 *
 * Blur values are kept subtle (max ~1.8px).
 */
const columns = [
  {
    speed: -120,
    offset: 60,
    images: [
      { src: heroImg, label: 'Golden Hour', cat: 'Wedding' },
      { src: galleryPortrait, label: 'Grace', cat: 'Portrait' },
      { src: weddingImg, label: 'Eternal', cat: 'Ceremony' },
      { src: galleryEvent, label: 'Jubilee', cat: 'Event' },
    ],
  },
  {
    speed: 180,
    offset: -100,
    images: [
      { src: galleryWedding, label: 'Timeless Vows', cat: 'Wedding' },
      { src: heroImg, label: 'Radiance', cat: 'Editorial' },
      { src: galleryPortrait, label: 'Elegance', cat: 'Studio' },
      { src: galleryEvent, label: 'Festivity', cat: 'Event' },
      { src: weddingImg, label: 'Promise', cat: 'Ceremony' },
    ],
  },
  {
    speed: -80,
    offset: 30,
    images: [
      { src: galleryEvent, label: 'Celebration', cat: 'Reception' },
      { src: weddingImg, label: 'Heritage', cat: 'Documentary' },
      { src: galleryWedding, label: 'Forever', cat: 'Wedding' },
      { src: heroImg, label: 'Luminance', cat: 'Portrait' },
    ],
  },
  {
    speed: 140,
    offset: -70,
    images: [
      { src: galleryPortrait, label: 'Serenity', cat: 'Studio' },
      { src: galleryEvent, label: 'Joy', cat: 'Event' },
      { src: heroImg, label: 'Bloom', cat: 'Editorial' },
      { src: galleryWedding, label: 'Devotion', cat: 'Wedding' },
      { src: weddingImg, label: 'Tender', cat: 'Ceremony' },
    ],
  },
  {
    speed: -160,
    offset: 90,
    images: [
      { src: weddingImg, label: 'Reverie', cat: 'Documentary' },
      { src: galleryPortrait, label: 'Poise', cat: 'Portrait' },
      { src: galleryEvent, label: 'Euphoria', cat: 'Reception' },
      { src: heroImg, label: 'Aura', cat: 'Editorial' },
    ],
  },
  {
    speed: 100,
    offset: -40,
    images: [
      { src: galleryWedding, label: 'Unity', cat: 'Wedding' },
      { src: heroImg, label: 'Dusk', cat: 'Landscape' },
      { src: weddingImg, label: 'Bliss', cat: 'Ceremony' },
      { src: galleryPortrait, label: 'Muse', cat: 'Studio' },
    ],
  },
];

/* Bokeh circle data — decorative blurred light spots */
const bokehCircles = [
  { x: '8%',  y: '15%', size: 90,  opacity: 0.18, color: 'rgba(200, 168, 130, 0.5)', speed: -60 },
  { x: '75%', y: '25%', size: 130, opacity: 0.12, color: 'rgba(245, 240, 235, 0.6)', speed: 80 },
  { x: '20%', y: '55%', size: 70,  opacity: 0.15, color: 'rgba(168, 137, 98, 0.4)',  speed: -100 },
  { x: '88%', y: '65%', size: 110, opacity: 0.1,  color: 'rgba(200, 168, 130, 0.45)', speed: 50 },
  { x: '45%', y: '80%', size: 60,  opacity: 0.2,  color: 'rgba(245, 240, 235, 0.5)', speed: -70 },
  { x: '60%', y: '10%', size: 80,  opacity: 0.14, color: 'rgba(200, 168, 130, 0.35)', speed: 90 },
  { x: '35%', y: '40%', size: 100, opacity: 0.08, color: 'rgba(245, 240, 235, 0.4)', speed: -40 },
];

export default function PortfolioGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fogRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bokehRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // ── Column parallax ──
      columnRefs.current.forEach((col, i) => {
        if (!col) return;
        const data = columns[i];

        // Parallax movement
        gsap.to(col, {
          y: data.speed,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        });
      });

      // ── Image fade-in ──
      const imgs = gsap.utils.toArray<HTMLElement>('.parallax-col-item');
      imgs.forEach((img) => {
        gsap.fromTo(img,
          { opacity: 0, scale: 0.92 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: img,
              start: 'top 92%',
              end: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // ── Cloud / fog layers parallax ──
      const fogSpeeds = [-200, 150, -300, 250, -180];
      fogRefs.current.forEach((fog, i) => {
        if (!fog) return;
        gsap.to(fog, {
          y: fogSpeeds[i],
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        });
      });

      // ── Bokeh circles parallax ──
      bokehRefs.current.forEach((bokeh, i) => {
        if (!bokeh) return;
        gsap.to(bokeh, {
          y: bokehCircles[i].speed,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      });

    }, section);

    return () => { ctx.revert(); };
  }, []);

  return (
    <section id="portfolio" className="parallax-portfolio" ref={sectionRef}>
      {/* Section header */}
      <div className="parallax-portfolio-header">
        <span className="parallax-portfolio-label">Portfolio</span>
        <h2>Selected <em>Work</em></h2>
      </div>

      {/* ── Cloud / fog layers ── */}
      <div className="parallax-fog-container">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`parallax-fog-layer parallax-fog-layer--${i}`}
            ref={(el) => { fogRefs.current[i] = el; }}
          />
        ))}
      </div>

      {/* ── Bokeh circles — blurred light spots ── */}
      <div className="parallax-bokeh-container">
        {bokehCircles.map((b, i) => (
          <div
            key={i}
            className="parallax-bokeh-circle"
            ref={(el) => { bokehRefs.current[i] = el; }}
            style={{
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            }}
          />
        ))}
      </div>

      {/* Top/bottom fog edges */}
      <div className="parallax-fog-edge parallax-fog-edge--top" />
      <div className="parallax-fog-edge parallax-fog-edge--bottom" />

      {/* Multi-column parallax grid */}
      <div className="parallax-columns-wrap">
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className={`parallax-col`}
            ref={(el) => { columnRefs.current[colIdx] = el; }}
            style={{
              transform: `translateY(${col.offset}px)`,
            }}
          >
            {col.images.map((img, imgIdx) => (
              <div key={imgIdx} className="parallax-col-item">
                <div className="parallax-col-img">
                  <img src={img.src} alt={img.label} loading="lazy" />
                </div>
                <div className="parallax-col-overlay">
                  <span className="parallax-col-cat">{img.cat}</span>
                  <span className="parallax-col-name">{img.label}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
