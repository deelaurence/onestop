import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import img1 from '../assets/hero.jpg';
import img2 from '../assets/gallery_portrait.png';
import img3 from '../assets/wedding.jpg';
import img4 from '../assets/gallery_wedding.png';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const scrollLayers = scrollRefs.current.filter(Boolean) as HTMLDivElement[];
    const inners = innerRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!section || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // ── Entrance ──
      gsap.fromTo(
        titleRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.4, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        metaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.6 }
      );
      gsap.fromTo(
        cards,
        { y: 60, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.4,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.4,
        }
      );

      // Split title into lines so each can slide independently.
      const titleLines = titleRef.current?.querySelectorAll<HTMLElement>('.hero-title-line');
      if (titleLines) {
        gsap.set(titleLines, { yPercent: 0, opacity: 1 });
      }

      // ── Pinned scroll choreography ──
      // First scrolls drive a timeline that subtly slides text and morphs cards.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=90%',
          pin: true,
          pinSpacing: true,
          scrub: 1.1,
          anticipatePin: 1,
        },
      });

      // Title: each line slides up at slightly staggered rates with morph in scale.
      if (titleLines) {
        titleLines.forEach((line, i) => {
          tl.to(
            line,
            {
              yPercent: -30 - i * 12,
              opacity: 0.15,
              letterSpacing: '-0.02em',
              ease: 'none',
            },
            0
          );
        });
      }

      // Meta block slides down and fades.
      tl.to(
        metaRef.current,
        { y: 60, opacity: 0, ease: 'none' },
        0
      );

      // Cards: parallax Y + subtle morph (scale, border-radius, rotation).
      const cardChoreo = [
        { y: -50, scale: 1.04, rotate: -1.2, radius: 18 },
        { y: -110, scale: 1.02, rotate: 0.6, radius: 32 },
        { y: -170, scale: 0.98, rotate: -0.8, radius: 48 },
        { y: -230, scale: 0.94, rotate: 1.4, radius: 64 },
      ];
      cards.forEach((_card, i) => {
        const c = cardChoreo[i] ?? cardChoreo[cardChoreo.length - 1];
        const scrollLayer = scrollLayers[i];
        if (scrollLayer) {
          tl.to(
            scrollLayer,
            {
              y: c.y,
              rotation: c.rotate,
              ease: 'none',
            },
            0
          );
        }
        const inner = inners[i];
        if (inner) {
          tl.to(
            inner,
            {
              scale: c.scale,
              borderRadius: `${c.radius}px`,
              ease: 'none',
            },
            0
          );
        }
      });

    }, section);

    // ── Mouse-move parallax (subtle depth illusion, layered on top of scroll) ──
    const mouseStrength = [10, 20, 32, 44];
    let mouseX = 0;
    let mouseY = 0;
    let renderX = 0;
    let renderY = 0;
    let raf = 0;
    let running = true;

    const onMouse = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    };
    const onLeave = () => {
      mouseX = 0;
      mouseY = 0;
    };

    const tick = () => {
      if (!running) return;
      renderX += (mouseX - renderX) * 0.08;
      renderY += (mouseY - renderY) * 0.08;
      cards.forEach((card, i) => {
        const ms = mouseStrength[i] ?? 8;
        card.style.setProperty('--mx', `${(renderX * ms).toFixed(2)}px`);
        card.style.setProperty('--my', `${(renderY * ms).toFixed(2)}px`);
      });
      raf = requestAnimationFrame(tick);
    };

    section.addEventListener('mousemove', onMouse);
    section.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    // Refresh ScrollTrigger after layout settles (images, fonts).
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(refreshTimer);
      section.removeEventListener('mousemove', onMouse);
      section.removeEventListener('mouseleave', onLeave);
      ctx.revert();
    };
  }, []);

  return (
    <section className="hero" ref={sectionRef}>
      <div className="hero-left">
        <h1 className="hero-title" ref={titleRef}>
          <span className="hero-title-line">Defining</span>
          <span className="hero-title-line">Moments</span>
          <span className="hero-title-line">Worldwide</span>
        </h1>
        <div className="hero-meta" ref={metaRef}>
          <p className="hero-bottom-text">
            Based in Canada. Available for international commissions. 
            Blending editorial precision with raw human emotion.
          </p>
          <button className="hero-button" onClick={() => {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Secure your date
          </button>
        </div>
      </div>

      <div className="hero-right">
        <div className="hero-stack-container">
          {[img1, img2, img3, img4].map((src, i) => (
            <div
              key={i}
              className={`hero-card hero-card--${i + 1}`}
              ref={(el) => { cardRefs.current[i] = el; }}
            >
              <div
                className="hero-card-scroll"
                ref={(el) => { scrollRefs.current[i] = el; }}
              >
                <div
                  className="hero-card-inner"
                  ref={(el) => { innerRefs.current[i] = el; }}
                >
                  <img src={src} alt={`Editorial ${i + 1}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
