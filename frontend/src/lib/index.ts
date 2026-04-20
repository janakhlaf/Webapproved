export const ROUTE_PATHS = {
  HOME: '/',
  FILMS: '/films',
  ASSETS: '/assets',
  ABOUT: '/about',
  PROFILE: '/profile',
  SIGNIN: '/signin',
  REGISTER: '/register',
} as const;

export interface Film {
  id: string;
  title: string;
  category: string;
  description: string;
  posterUrl: string;
  videoUrl?: string;
  duration?: string;
  releaseYear?: number;
  director?: string;
  tags?: string[];
}

export interface Asset {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  modelType: string;
  tags?: string[];
  fileSize?: string;
  format?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  accountType?: string;
  createdAt?: string;
}

export const THEME_KEYWORDS: Record<string, { hue: number; saturation: number; lightness: number }> = {
  'sci-fi': { hue: 220, saturation: 0.35, lightness: 0.12 },
  'science fiction': { hue: 220, saturation: 0.35, lightness: 0.12 },
  'technology': { hue: 195, saturation: 0.32, lightness: 0.10 },
  'ai': { hue: 195, saturation: 0.32, lightness: 0.10 },
  'artificial intelligence': { hue: 195, saturation: 0.32, lightness: 0.10 },
  'horror': { hue: 0, saturation: 0.25, lightness: 0.06 },
  'thriller': { hue: 10, saturation: 0.20, lightness: 0.08 },
  'nature': { hue: 140, saturation: 0.28, lightness: 0.10 },
  'memory': { hue: 240, saturation: 0.30, lightness: 0.10 },
  'human mind': { hue: 240, saturation: 0.30, lightness: 0.10 },
  'consciousness': { hue: 270, saturation: 0.32, lightness: 0.10 },
  'drama': { hue: 330, saturation: 0.25, lightness: 0.10 },
  'action': { hue: 30, saturation: 0.30, lightness: 0.10 },
  'documentary': { hue: 180, saturation: 0.20, lightness: 0.12 },
  'art': { hue: 290, saturation: 0.28, lightness: 0.11 },
};

export const FILM_CATEGORIES = [
  'All Categories',
  'Sci-Fi',
  'Thriller',
  'Drama',
  'Horror',
  'Action',
  'Art House',
  'Documentary',
] as const;

export const ASSET_CATEGORIES = [
  'All',
  'Characters',
  'Environments',
  'Props',
  'Vehicles',
  'Effects',
  'Architecture',
] as const;

export type FilmCategory = typeof FILM_CATEGORIES[number];
export type AssetCategory = typeof ASSET_CATEGORIES[number];

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const detectThemeKeyword = (text: string): string | null => {
  const lowerText = text.toLowerCase();
  for (const keyword of Object.keys(THEME_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return keyword;
    }
  }
  return null;
};

export const getThemeColors = (keyword: string | null) => {
  if (!keyword || !THEME_KEYWORDS[keyword]) {
    return {
      hue: 240,
      saturation: 0.015,
      lightness: 0.08,
    };
  }
  return THEME_KEYWORDS[keyword];
};
