import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import weddingImg from '../assets/wedding.jpg';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    gsap.fromTo(el.querySelector('.about-content'),
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 70%' },
      }
    );
    gsap.fromTo(el.querySelector('.about-image'),
      { y: 80, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2,
        scrollTrigger: { trigger: el, start: 'top 70%' },
      }
    );
  }, []);

  return (
    <section id="about" className="about-section" ref={sectionRef}>
      <div className="about-inner">
        <div className="about-content">
          <div className="about-label">The Vision</div>
          <h2 className="about-title">
            Artistry without <em>Boundaries</em>.
          </h2>
          <p className="about-text">
            Based in the heart of Canada, Onestop Photography is a premier creative studio 
            dedicated to capturing life's most profound narratives. We don't just document 
            events; we craft visual legacies. 
            <br /><br />
            From high-fashion editorial in Paris to intimate weddings in the Canadian Rockies, 
            our lens spans a vast range of genres including commercial, portraiture, 
            and documentary. We are world-travelers at heart, driven by the belief that 
            every culture and every moment deserves to be seen through a lens of 
            sophistication and raw honesty.
          </p>
          <div className="about-stats">
            <div>
              <div className="about-stat-number">10+</div>
              <div className="about-stat-label">Years Experience</div>
            </div>
            <div>
              <div className="about-stat-number">500+</div>
              <div className="about-stat-label">Happy Clients</div>
            </div>
            <div>
              <div className="about-stat-number">2k+</div>
              <div className="about-stat-label">Projects</div>
            </div>
          </div>
        </div>
        <div className="about-image">
          <img src={weddingImg} alt="About Onestop" />
        </div>
      </div>
    </section>
  );
}
