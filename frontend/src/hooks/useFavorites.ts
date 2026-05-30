import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

const API_URL = 'http://127.0.0.1:8000';

interface FavoritesState {
  films: number[];
  assets: number[];
}

export const useFavorites = () => {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<FavoritesState>({
    films: [],
    assets: [],
  });

  const loadFavorites = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/favorites/${Number(user.id)}`);

      if (!response.ok) {
        console.error('Failed to load favorites');
        return;
      }

      const data = await response.json();

      setFavorites({
        films: data.films || [],
        assets: data.assets || [],
      });
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFilmFavorite = async (filmId: number) => {
    if (!user?.id) return;

    setFavorites((prev) => ({
      ...prev,
      films: prev.films.includes(filmId)
        ? prev.films.filter((id) => id !== filmId)
        : [...prev.films, filmId],
    }));

    await fetch(`${API_URL}/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(user.id),
        item_type: 'film',
        item_id: filmId,
      }),
    });
  };

  const toggleAssetFavorite = async (assetId: number) => {
    if (!user?.id) return;

    setFavorites((prev) => ({
      ...prev,
      assets: prev.assets.includes(assetId)
        ? prev.assets.filter((id) => id !== assetId)
        : [...prev.assets, assetId],
    }));

    await fetch(`${API_URL}/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: Number(user.id),
        item_type: 'asset',
        item_id: assetId,
      }),
    });
  };

  const clearAllFavorites = async () => {
    if (!user?.id) return;

    await fetch(`${API_URL}/favorites/clear/${Number(user.id)}`, {
      method: 'DELETE',
    });

    setFavorites({ films: [], assets: [] });
  };

  return {
    favoriteFilms: favorites.films,
    favoriteAssets: favorites.assets,
    toggleFilmFavorite,
    toggleAssetFavorite,
    isFilmFavorite: (filmId: number) => favorites.films.includes(filmId),
    isAssetFavorite: (assetId: number) => favorites.assets.includes(assetId),
    clearAllFavorites,
  };
};