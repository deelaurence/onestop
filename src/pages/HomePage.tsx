import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { isReducedPerformance } from '../lib/performance';
import Hero from '../components/Hero';
import PortfolioGrid from '../components/PortfolioGrid';
import About from '../components/About';
import Marquee from '../components/Marquee';
import CtaSection from '../components/CtaSection';
import { lazy, Suspense } from 'react';

const DarkroomGallery = lazy(() => import('../components/DarkroomGallery'));

gsap.registerPlugin(ScrollTrigger);

interface HomePageProps {
  ready: boolean;
}

export default function HomePage({ ready }: HomePageProps) {
  const reduced = isReducedPerformance();

  useEffect(() => {
    if (!ready) return;

    ScrollTrigger.refresh();

    if (reduced) {
      const onScroll = () => ScrollTrigger.update();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
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
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [ready, reduced]);

  return (
    <>
      <Hero />
      <Suspense fallback={<section className="darkroom-section darkroom-section--lite" aria-hidden="true" />}>
        <DarkroomGallery />
      </Suspense>
      <PortfolioGrid />
      <About />
      <Marquee />
      <CtaSection />
    </>
  );
}
