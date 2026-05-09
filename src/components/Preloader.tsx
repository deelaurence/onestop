import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        if (p >= 100) { clearInterval(id); return 100; }
        return p + 2;
      });
    }, 25);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct === 100) {
      gsap.to(el.current, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power4.inOut',
        delay: 0.4,
        onComplete: onDone,
      });
    }
  }, [pct, onDone]);

  return (
    <div ref={el} className="preloader">
      <div className="preloader-number">{pct}</div>
      <div className="preloader-bar-track">
        <div className="preloader-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="preloader-label">Loading Experience</div>
    </div>
  );
}
