import { useState, useEffect } from 'react';

interface FavoritesState {
  films: string[];
  assets: string[];
}

const STORAGE_KEY = 'human-mind-ai-favorites';

const normalizeFavorites = (favorites: FavoritesState): FavoritesState => ({
  films: [...new Set(favorites.films || [])],
  assets: [...new Set(favorites.assets || [])],
});

const getStoredFavorites = (): FavoritesState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return normalizeFavorites(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Failed to parse favorites from localStorage:', error);
  }

  return { films: [], assets: [] };
};

const setStoredFavorites = (favorites: FavoritesState): void => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeFavorites(favorites))
    );
  } catch (error) {
    console.error('Failed to save favorites to localStorage:', error);
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoritesState>(getStoredFavorites);

  useEffect(() => {
    const syncFavorites = () => {
      setFavorites(getStoredFavorites());
    };

    window.addEventListener('favorites-updated', syncFavorites);

    return () => {
      window.removeEventListener('favorites-updated', syncFavorites);
    };
  }, []);

  const updateFavorites = (updater: (prev: FavoritesState) => FavoritesState) => {
    const latest = getStoredFavorites();
    const updated = normalizeFavorites(updater(latest));

    setFavorites(updated);
    setStoredFavorites(updated);

    window.dispatchEvent(new Event('favorites-updated'));
  };

  const toggleFilmFavorite = (filmId: string) => {
    updateFavorites((prev) => {
      const isFavorite = prev.films.includes(filmId);

      return {
        ...prev,
        films: isFavorite
          ? prev.films.filter((id) => id !== filmId)
          : [...prev.films, filmId],
      };
    });
  };

  const toggleAssetFavorite = (assetId: string) => {
    updateFavorites((prev) => {
      const isFavorite = prev.assets.includes(assetId);

      return {
        ...prev,
        assets: isFavorite
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
   const empty: FavoritesState = { films: [], assets: [] };
    setFavorites(empty);
    setStoredFavorites(empty);

    window.dispatchEvent(new Event('favorites-updated'));
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