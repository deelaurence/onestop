import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import './App.css';

import { isReducedPerformance, prefersFinePointer } from './lib/performance';
import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import SiteLayout from './components/layout/SiteLayout';
import HomePage from './pages/HomePage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BookPage from './pages/BookPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [ready, setReady] = useState(!isHome);
  const reduced = isReducedPerformance();
  const showCursor = prefersFinePointer() && !reduced;

  return (
    <>
      {isHome && !ready && <Preloader onDone={() => setReady(true)} />}
      {showCursor && <CustomCursor />}
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route element={<SiteLayout />}>
          <Route path="/" element={<HomePage ready={ready} />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/book" element={<BookPage />} />
        </Route>
      </Routes>
    </>
  );
}
