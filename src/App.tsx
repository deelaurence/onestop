import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';

import { isReducedPerformance, prefersFinePointer } from './lib/performance';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import SiteLayout from './components/layout/SiteLayout';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

export default function App() {
  const [ready, setReady] = useState(false);
  const reduced = isReducedPerformance();
  const showCursor = prefersFinePointer() && !reduced;

  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      {showCursor && <CustomCursor />}
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage ready={ready} />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </>
  );
}
