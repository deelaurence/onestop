import { useEffect } from 'react';
import About from '../components/About';

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="standalone-page standalone-page--about">
      <header className="standalone-page-header">
        <span className="standalone-page-label">About Us</span>
        <h1>The story behind <em>Onestop</em></h1>
        <p>
          A Canada-based studio crafting visual legacies across weddings, portraits,
          school photography, commercial campaigns, and events worldwide.
        </p>
      </header>
      <About standalone />
    </section>
  );
}
