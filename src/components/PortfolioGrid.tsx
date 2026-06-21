import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isReducedPerformance } from '../lib/performance';
import {
  distributeIntoColumns,
  getCategoryLabel,
  getFeaturedItems,
} from '../data/portfolio';

gsap.registerPlugin(ScrollTrigger);

const COLUMN_CONFIG = [
  { speed: -120, offset: 60 },
  { speed: 180, offset: -100 },
  { speed: -80, offset: 30 },
  { speed: 140, offset: -70 },
  { speed: -160, offset: 90 },
  { speed: 100, offset: -40 },
];

const featuredItems = getFeaturedItems();
const columns = distributeIntoColumns(featuredItems, 6).map((images, i) => ({
  ...COLUMN_CONFIG[i],
  images,
}));

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
  const reduced = isReducedPerformance();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      columnRefs.current.forEach((col, i) => {
        if (!col) return;
        const data = columns[i];
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

      if (!reduced) {
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
      }
    }, section);

    return () => { ctx.revert(); };
  }, [reduced]);

  return (
    <section id="portfolio" className="parallax-portfolio" ref={sectionRef}>
      <div className="parallax-portfolio-header">
        <span className="parallax-portfolio-label">Portfolio</span>
        <h2>Selected <em>Work</em></h2>
        <Link to="/portfolio" className="parallax-portfolio-link">
          View all categories <ArrowUpRight size={16} />
        </Link>
      </div>

      {!reduced && (
        <>
          <div className="parallax-fog-container">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`parallax-fog-layer parallax-fog-layer--${i}`}
                ref={(el) => { fogRefs.current[i] = el; }}
              />
            ))}
          </div>

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
        </>
      )}

      <div className="parallax-fog-edge parallax-fog-edge--top" />
      <div className="parallax-fog-edge parallax-fog-edge--bottom" />

      <div className="parallax-columns-wrap">
        {columns.map((col, colIdx) => (
          <div
            key={colIdx}
            className="parallax-col"
            ref={(el) => { columnRefs.current[colIdx] = el; }}
            style={{ transform: `translateY(${col.offset}px)` }}
          >
            {col.images.map((item) => (
              <Link key={item.id} to="/portfolio" className="parallax-col-item">
                <div className="parallax-col-img">
                  <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
                </div>
                <div className="parallax-col-overlay">
                  <span className="parallax-col-cat">{getCategoryLabel(item.category)}</span>
                  <span className="parallax-col-name">{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
