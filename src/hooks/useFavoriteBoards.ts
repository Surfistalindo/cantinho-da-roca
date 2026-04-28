import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { boardService } from '@/services/boardService';

export function useFavoriteBoards() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const favs = await boardService.listFavorites();
      setFavoriteIds(favs.map((f) => f.board_id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('board-favorites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_favorites' }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const isFavorite = (board_id: string) => favoriteIds.includes(board_id);

  const toggle = async (board_id: string) => {
    if (isFavorite(board_id)) {
      await boardService.removeFavorite(board_id);
    } else {
      await boardService.addFavorite(board_id);
    }
    await refresh();
  };

  return { favoriteIds, isFavorite, toggle, loading, refresh };
}
