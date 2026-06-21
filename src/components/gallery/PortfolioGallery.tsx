import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import {
  PORTFOLIO_CATEGORIES,
  getCategoryCount,
  getItemsByCategory,
  getCategoryLabel,
  type PortfolioFilter,
  type PortfolioItem,
} from '../../data/portfolio';
import Lightbox from './Lightbox';

interface PortfolioGalleryProps {
  items?: PortfolioItem[];
  showFilters?: boolean;
  showViewAllLink?: boolean;
  initialCategory?: PortfolioFilter;
  title?: ReactNode;
  subtitle?: string;
  variant?: 'page' | 'embedded';
}

export default function PortfolioGallery({
  items,
  showFilters = true,
  showViewAllLink = false,
  initialCategory = 'all',
  title,
  subtitle,
  variant = 'page',
}: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<PortfolioFilter>(initialCategory);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    if (items) {
      if (activeCategory === 'all') return items;
      return items.filter((item) => item.category === activeCategory);
    }
    return getItemsByCategory(activeCategory);
  }, [items, activeCategory]);

  const activeMeta = PORTFOLIO_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <div className={`portfolio-gallery portfolio-gallery--${variant}`}>
      {(title || subtitle) && (
        <header className="portfolio-gallery-header">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}

      {showFilters && (
        <div className="portfolio-filters">
          <div className="portfolio-filters-track" role="tablist" aria-label="Portfolio categories">
            {PORTFOLIO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`portfolio-filter${activeCategory === cat.id ? ' portfolio-filter--active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className="portfolio-filter-count">{getCategoryCount(cat.id)}</span>
              </button>
            ))}
          </div>
          {activeMeta && variant === 'page' && (
            <p className="portfolio-filters-desc">{activeMeta.description}</p>
          )}
        </div>
      )}

      <div className="portfolio-grid" key={activeCategory}>
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className="portfolio-card"
            style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            onClick={() => setLightboxIndex(index)}
          >
            <div className="portfolio-card-media">
              <img src={item.src} alt={item.title} loading="lazy" decoding="async" />
            </div>
            <div className="portfolio-card-overlay">
              <span className="portfolio-card-cat">{getCategoryLabel(item.category)}</span>
              <span className="portfolio-card-title">{item.title}</span>
            </div>
          </button>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="portfolio-empty">No images in this category yet.</p>
      )}

      {showViewAllLink && (
        <div className="portfolio-view-all">
          <Link to="/portfolio" className="portfolio-view-all-link">
            View Full Portfolio <ArrowUpRight size={16} />
          </Link>
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={filteredItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
