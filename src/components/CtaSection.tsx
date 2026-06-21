import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function CtaSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0 },
      {
        opacity: 1, duration: 1,
        scrollTrigger: { trigger: ref.current, start: 'top 80%' },
      }
    );
  }, []);

  return (
    <section id="contact" className="cta-section" ref={ref}>
      <h2 className="cta-title">
        Let's build your <em>Visual Legacy</em>.
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 3rem', fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 300 }}>
        Based in Canada, capturing the world. Whether it's an editorial campaign, 
        a high-profile event, or a destination wedding, we are ready to travel 
        to you. Elevate your narrative with a global perspective.
      </p>
      <Link to="/contact" className="cta-button">
        Check Availability <ArrowRight size={16} />
      </Link>
      <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>hello@onestopphotography.org</div>
        </div>
        <div style={{ width: 1, background: 'rgba(0,0,0,0.1)' }} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.4em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Phone</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>+1 (234) 567 890</div>
        </div>
      </div>
    </section>
  );
}
