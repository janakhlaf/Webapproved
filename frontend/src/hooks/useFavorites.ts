import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from './useAuth';

interface FavoritesState {
  films: number[];
  assets: number[];
}

type FavoriteRow = {
  film_id: number | null;
  asset_id: number | null;
};

export const useFavorites = () => {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<FavoritesState>({
    films: [],
    assets: [],
  });

  const loadFavorites = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('film_id, asset_id')
      .eq('user_id', Number(user.id));

    if (error) {
      console.error('Failed to load favorites:', error);
      return;
    }

    const rows = (data || []) as FavoriteRow[];

    setFavorites({
      films: rows
        .filter((item) => item.film_id !== null)
        .map((item) => Number(item.film_id)),
      assets: rows
        .filter((item) => item.asset_id !== null)
        .map((item) => Number(item.asset_id)),
    });
  }, [user?.id]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFilmFavorite = async (filmId: number) => {
    if (!user?.id) return;

    const isFavorite = favorites.films.includes(filmId);

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', Number(user.id))
        .eq('film_id', filmId);
    } else {
      await supabase.from('favorites').insert({
        user_id: Number(user.id),
        film_id: filmId,
        asset_id: null,
      });
    }

    await loadFavorites();
  };

  const toggleAssetFavorite = async (assetId: number) => {
    if (!user?.id) return;

    const isFavorite = favorites.assets.includes(assetId);

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', Number(user.id))
        .eq('asset_id', assetId);
    } else {
      await supabase.from('favorites').insert({
        user_id: Number(user.id),
        film_id: null,
        asset_id: assetId,
      });
    }

    await loadFavorites();
  };

  return {
    favoriteFilms: favorites.films,
    favoriteAssets: favorites.assets,
    toggleFilmFavorite,
    toggleAssetFavorite,
    isFilmFavorite: (filmId: number) => favorites.films.includes(filmId),
    isAssetFavorite: (assetId: number) => favorites.assets.includes(assetId),
    clearAllFavorites: async () => {
      if (!user?.id) return;

      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', Number(user.id));

      setFavorites({ films: [], assets: [] });
    },
  };
};