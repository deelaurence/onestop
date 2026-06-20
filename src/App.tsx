import { lazy, Suspense, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './App.css';

import { isReducedPerformance, prefersFinePointer } from './lib/performance';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import PortfolioGrid from './components/PortfolioGrid';
import About from './components/About';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';

const DarkroomGallery = lazy(() => import('./components/DarkroomGallery'));

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [ready, setReady] = useState(false);
  const reduced = isReducedPerformance();
  const showCursor = prefersFinePointer() && !reduced;

  useEffect(() => {
    if (!ready) return;

    if (reduced) {
      const onScroll = () => ScrollTrigger.update();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: false,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(500, 16);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [ready, reduced]);

  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      {showCursor && <CustomCursor />}
      <Navbar />

      <main>
        <Hero />
        <Suspense fallback={<section className="darkroom-section darkroom-section--lite" aria-hidden="true" />}>
          <DarkroomGallery />
        </Suspense>
        <PortfolioGrid />
        <About />
        <Marquee />
        <CtaSection />
        <Footer />
      </main>
    </>
  );
}
