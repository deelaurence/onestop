import { useEffect } from 'react';
import PortfolioGallery from '../components/gallery/PortfolioGallery';

export default function PortfolioPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="portfolio-page">
      <PortfolioGallery
        variant="page"
        title={<>Our <em>Portfolio</em></>}
        subtitle="Explore weddings, portraits, school photography, studio sessions, commercial work, and more — curated from our latest shoots."
      />
    </section>
  );
}
