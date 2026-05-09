import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './App.css';

import ThreeScene from './components/ThreeScene';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import DarkroomGallery from './components/DarkroomGallery';
import PortfolioGrid from './components/PortfolioGrid';
import About from './components/About';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: false,
      touchMultiplier: 2,
    });

    // Sync ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP ticker for a single, optimized loop
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [ready]);

  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      <CustomCursor />
      <Navbar />

      {/* 3D Camera — always fixed on screen */}
      <div className="three-canvas-wrapper">
        <Canvas dpr={[1, 2]} shadows>
          <ThreeScene />
        </Canvas>
      </div>

      <main>
        <Hero />
        <DarkroomGallery />
        <PortfolioGrid />
        <About />
        <Marquee />
        <CtaSection />
        <Footer />
      </main>
    </>
  );
}
