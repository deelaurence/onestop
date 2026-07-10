import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

export default function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const el = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          clearInterval(id);
          return 100;
        }
        return p + 2;
      });
    }, 25);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct !== 100 || !el.current) return;

    const node = el.current;
    const tween = gsap.to(node, {
      yPercent: -100,
      duration: 1.2,
      ease: 'power4.inOut',
      delay: 0.4,
      onComplete: () => {
        gsap.set(node, { clearProps: 'transform' });
        finish();
      },
    });

    return () => {
      tween.kill();
      gsap.set(node, { clearProps: 'transform' });
    };
  }, [pct, finish]);

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
