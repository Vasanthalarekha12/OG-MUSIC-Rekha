import { useState, useEffect } from 'react';
import { youtubeService } from './youtubeService';
import type { Song } from '../../types';

interface UseYouTubeState {
  data: Song[];
  loading: boolean;
  error: string | null;
}

export function useYouTubeSearch(query: string, maxResults: number = 24) {
  const [state, setState] = useState<UseYouTubeState>({ data: [], loading: false, error: null });

  useEffect(() => {
    if (!query) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let isMounted = true;
    setState(s => ({ ...s, loading: true, error: null }));

    youtubeService.search(query, maxResults)
      .then(res => {
        if (isMounted) setState({ data: res.items, loading: false, error: null });
      })
      .catch(err => {
        if (isMounted) setState({ data: [], loading: false, error: err.message });
      });

    return () => {
      isMounted = false;
    };
  }, [query, maxResults]);

  return state;
}

export function useYouTubeTrending(regionCode: string = 'IN', maxResults: number = 12) {
  const [state, setState] = useState<UseYouTubeState>({ data: [], loading: true, error: null });

  useEffect(() => {
    let isMounted = true;

    youtubeService.getTrendingMusic(regionCode, maxResults)
      .then(data => {
        if (isMounted) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (isMounted) setState({ data: [], loading: false, error: err.message });
      });

    return () => {
      isMounted = false;
    };
  }, [regionCode, maxResults]);

  return state;
}

export function useYouTubeCategory(category: string, maxResults: number = 12) {
  const [state, setState] = useState<UseYouTubeState>({ data: [], loading: true, error: null });

  useEffect(() => {
    if (!category) {
      setState({ data: [], loading: false, error: null });
      return;
    }

    let isMounted = true;
    setState(s => ({ ...s, loading: true, error: null }));

    youtubeService.getCategoryMusic(category, maxResults)
      .then(data => {
        if (isMounted) setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (isMounted) setState({ data: [], loading: false, error: err.message });
      });

    return () => {
      isMounted = false;
    };
  }, [category, maxResults]);

  return state;
}
