export type PortfolioCategory =
  | 'wedding'
  | 'portrait'
  | 'school'
  | 'studio'
  | 'commercial'
  | 'events'
  | 'landscape';

export type PortfolioFilter = 'all' | PortfolioCategory;

export interface PortfolioItem {
  id: string;
  src: string;
  title: string;
  category: PortfolioCategory;
}

export interface CategoryMeta {
  id: PortfolioFilter;
  label: string;
  description: string;
}

const modules = import.meta.glob<string>('../assets/*.webp', {
  eager: true,
  import: 'default',
});

function categoryFromFilename(file: string): PortfolioCategory {
  if (file.startsWith('wedding-')) return 'wedding';
  if (file.startsWith('portrait-')) return 'portrait';
  if (file.startsWith('school-')) return 'school';
  if (file.startsWith('studio-')) return 'studio';
  if (file.startsWith('commercial-')) return 'commercial';
  if (file.startsWith('event-')) return 'events';
  return 'landscape';
}

function titleFromFilename(file: string): string {
  return file
    .replace(/\.webp$/i, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildPortfolioItems(): PortfolioItem[] {
  return Object.entries(modules)
    .map(([path, src]) => {
      const file = path.split('/').pop()!;
      const id = file.replace(/\.webp$/i, '');
      return {
        id,
        src,
        title: titleFromFilename(file),
        category: categoryFromFilename(id),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const PORTFOLIO_ITEMS = buildPortfolioItems();

export const PORTFOLIO_CATEGORIES: CategoryMeta[] = [
  { id: 'all', label: 'All Work', description: 'Browse the full collection' },
  { id: 'wedding', label: 'Weddings', description: 'Ceremony, reception & candid moments' },
  { id: 'portrait', label: 'Portraits', description: 'Headshots, editorial & studio sessions' },
  { id: 'school', label: 'School', description: 'Graduations, uniforms & panoramas' },
  { id: 'studio', label: 'Studio', description: 'Formal couples & creative studio work' },
  { id: 'commercial', label: 'Commercial', description: 'Food, catering & brand imagery' },
  { id: 'events', label: 'Events', description: 'Celebrations & live coverage' },
  { id: 'landscape', label: 'Landscape', description: 'Travel & environmental scenes' },
];

export function getItemsByCategory(category: PortfolioFilter): PortfolioItem[] {
  if (category === 'all') return PORTFOLIO_ITEMS;
  return PORTFOLIO_ITEMS.filter((item) => item.category === category);
}

export function getCategoryCount(category: PortfolioFilter): number {
  return getItemsByCategory(category).length;
}

const HERO_IDS = [
  'wedding-couple-embrace-forest-portrait',
  'portrait-woman-colorful-dress-full-length',
  'wedding-ceremony-outdoor-arch-officiant',
  'studio-portrait-couple-elegant-headshot',
] as const;

export function getHeroImages(): PortfolioItem[] {
  return HERO_IDS.map(
    (id) => PORTFOLIO_ITEMS.find((item) => item.id === id) ?? PORTFOLIO_ITEMS[0]
  ).filter(Boolean) as PortfolioItem[];
}

const FEATURED_IDS = [
  'wedding-bride-church-aisle-procession',
  'portrait-woman-formal-gele-lace-gown-full',
  'wedding-reception-first-dance',
  'school-panorama-students-staff-assembly',
  'wedding-couple-laughing-garden-arch',
  'portrait-man-traditional-kaftan-headshot',
  'wedding-garden-ceremony-wide-overview',
  'school-graduation-woman-kente-diploma',
  'studio-portrait-couple-lift-playful',
  'commercial-food-jollof-rice-chicken',
  'wedding-couple-aisle-exit-bubbles',
  'portrait-woman-business-suit-blazer-pose',
  'wedding-group-portrait-waving-formal',
  'school-girl-grenville-uniform-portrait',
  'landscape-shipwreck-beach-sunset',
  'wedding-couple-deck-balcony-embrace',
  'portrait-woman-colorful-blouse-studio',
  'event-catering-fruit-skewer-detail',
  'wedding-party-playful-bubble-guns',
  'portrait-nurse-scrubs-playful-pose',
  'wedding-ceremony-church-wide-interior',
  'studio-portrait-woman-stool-monochrome',
  'school-panorama-students-staff-turf',
  'wedding-bride-parents-aisle-procession',
] as const;

export function getFeaturedItems(): PortfolioItem[] {
  const picked = FEATURED_IDS.map(
    (id) => PORTFOLIO_ITEMS.find((item) => item.id === id)!
  ).filter(Boolean);

  if (picked.length >= 24) return picked;

  const extras = PORTFOLIO_ITEMS.filter((item) => !picked.some((p) => p.id === item.id));
  return [...picked, ...extras].slice(0, 24);
}

export function distributeIntoColumns(items: PortfolioItem[], columnCount = 6): PortfolioItem[][] {
  const columns: PortfolioItem[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => {
    columns[index % columnCount].push(item);
  });
  return columns;
}

export function getCategoryLabel(category: PortfolioCategory): string {
  return PORTFOLIO_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}
