import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { PortfolioItem } from '../../data/portfolio';
import { getCategoryLabel } from '../../data/portfolio';

interface LightboxProps {
  items: PortfolioItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const item = items[index];

  const goPrev = useCallback(() => {
    onNavigate(index === 0 ? items.length - 1 : index - 1);
  }, [index, items.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(index === items.length - 1 ? 0 : index + 1);
  }, [index, items.length, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (!item) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.title}>
      <button type="button" className="lightbox-backdrop" onClick={onClose} aria-label="Close" />
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close gallery">
        <X size={22} />
      </button>
      <button type="button" className="lightbox-nav lightbox-nav--prev" onClick={goPrev} aria-label="Previous image">
        <ChevronLeft size={28} />
      </button>
      <figure className="lightbox-figure">
        <img src={item.src} alt={item.title} />
        <figcaption className="lightbox-caption">
          <span className="lightbox-caption-cat">{getCategoryLabel(item.category)}</span>
          <span className="lightbox-caption-title">{item.title}</span>
          <span className="lightbox-caption-count">{index + 1} / {items.length}</span>
        </figcaption>
      </figure>
      <button type="button" className="lightbox-nav lightbox-nav--next" onClick={goNext} aria-label="Next image">
        <ChevronRight size={28} />
      </button>
    </div>
  );
}
