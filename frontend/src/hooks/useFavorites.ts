import { useState, useEffect } from 'react';

interface FavoritesState {
  films: string[];
  assets: string[];
}

const STORAGE_KEY = 'human-mind-ai-favorites';

const getStoredFavorites = (): FavoritesState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse favorites from localStorage:', error);
  }
  return { films: [], assets: [] };
};

const setStoredFavorites = (favorites: FavoritesState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites to localStorage:', error);
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoritesState>(getStoredFavorites);

  useEffect(() => {
    setStoredFavorites(favorites);
  }, [favorites]);

  const toggleFilmFavorite = (filmId: string) => {
    setFavorites((prev) => {
      const isCurrentlyFavorite = prev.films.includes(filmId);
      return {
        ...prev,
        films: isCurrentlyFavorite
          ? prev.films.filter((id) => id !== filmId)
          : [...prev.films, filmId],
      };
    });
  };

  const toggleAssetFavorite = (assetId: string) => {
    setFavorites((prev) => {
      const isCurrentlyFavorite = prev.assets.includes(assetId);
      return {
        ...prev,
        assets: isCurrentlyFavorite
          ? prev.assets.filter((id) => id !== assetId)
          : [...prev.assets, assetId],
      };
    });
  };

  const isFilmFavorite = (filmId: string): boolean => {
    return favorites.films.includes(filmId);
  };

  const isAssetFavorite = (assetId: string): boolean => {
    return favorites.assets.includes(assetId);
  };

  const clearAllFavorites = () => {
    setFavorites({ films: [], assets: [] });
  };

  return {
    favoriteFilms: favorites.films,
    favoriteAssets: favorites.assets,
    toggleFilmFavorite,
    toggleAssetFavorite,
    isFilmFavorite,
    isAssetFavorite,
    clearAllFavorites,
  };
};
