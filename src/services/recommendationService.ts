import type { Song } from '../types';

export interface ListeningSignal {
  trackId: string;
  artistId?: string;
  artistName?: string;
  albumId?: string;
  language?: string;
  genre?: string;
  playCount: number;
  skipCount: number;
  lastPlayedAt: number;
  isFavorite: boolean;
  totalListeningTimeSec: number;
  completionRatioSum: number;
  addedToPlaylistCount: number;
}

export interface RecommendationResult {
  tracks: Song[];
  isPersonalized: boolean;
  headline: string;
}

export interface ScoringWeights {
  artistWeight: number;
  languageWeight: number;
  genreWeight: number;
  albumWeight: number;
  favoriteBonus: number;
  repeatBonus: number;
  recentTrackPenalty: number;
  decayRatePerDay: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  artistWeight: 3.5,
  languageWeight: 2.5,
  genreWeight: 1.8,
  albumWeight: 2.2,
  favoriteBonus: 5.0,
  repeatBonus: 2.5,
  recentTrackPenalty: 8.0,
  decayRatePerDay: 0.1 // ~7 day half-life
};

class RecommendationService {
  private currentUserId: string = 'guest';
  private signals: Record<string, ListeningSignal> = {};
  private weights: ScoringWeights = { ...DEFAULT_SCORING_WEIGHTS };

  constructor() {
    this.loadSignals();
  }

  public setWeights(customWeights: Partial<ScoringWeights>) {
    this.weights = { ...this.weights, ...customWeights };
  }

  public setUser(userId?: string) {
    const nextUser = userId || 'guest';
    if (this.currentUserId !== nextUser) {
      this.currentUserId = nextUser;
      this.loadSignals();
    }
  }

  public clearSignals() {
    this.signals = {};
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      // Non-fatal
    }
  }

  private get storageKey(): string {
    return `og_music_user_signals_${this.currentUserId}`;
  }

  private loadSignals() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.signals = JSON.parse(stored);
      } else {
        this.signals = {};
      }
    } catch (e) {
      console.error('Failed to load listening signals:', e);
      this.signals = {};
    }
  }

  private saveSignals() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.signals));
    } catch (e) {
      console.error('Failed to save listening signals:', e);
    }
  }

  private getOrCreateSignal(song: Song): ListeningSignal {
    if (!this.signals[song.id]) {
      this.signals[song.id] = {
        trackId: song.id,
        artistId: song.artistId,
        artistName: song.artistName,
        albumId: song.albumId,
        language: song.languages?.[0]?.toLowerCase(),
        genre: song.genreName || song.genreId,
        playCount: 0,
        skipCount: 0,
        lastPlayedAt: Date.now(),
        isFavorite: false,
        totalListeningTimeSec: 0,
        completionRatioSum: 0,
        addedToPlaylistCount: 0
      };
    }
    return this.signals[song.id];
  }

  /**
   * Record when user starts playing a song
   */
  public recordPlay(song: Song) {
    if (!song?.id) return;
    const signal = this.getOrCreateSignal(song);
    signal.playCount += 1;
    signal.lastPlayedAt = Date.now();
    this.saveSignals();
  }

  /**
   * Record listening duration and completion ratio
   */
  public recordCompletion(song: Song, listenedSeconds: number, totalDuration: number) {
    if (!song?.id || totalDuration <= 0) return;
    const signal = this.getOrCreateSignal(song);
    signal.totalListeningTimeSec += listenedSeconds;
    const ratio = Math.min(1, Math.max(0, listenedSeconds / totalDuration));
    signal.completionRatioSum += ratio;

    // If played less than 15% and stopped, mark as skip
    if (ratio < 0.15 && listenedSeconds < 15) {
      signal.skipCount += 1;
    }
    this.saveSignals();
  }

  /**
   * Record explicit skip action
   */
  public recordSkip(song: Song) {
    if (!song?.id) return;
    const signal = this.getOrCreateSignal(song);
    signal.skipCount += 1;
    this.saveSignals();
  }

  /**
   * Record favorite toggle
   */
  public recordFavorite(songId: string, isFavorite: boolean) {
    if (this.signals[songId]) {
      this.signals[songId].isFavorite = isFavorite;
      this.saveSignals();
    }
  }

  /**
   * Record track added to playlist
   */
  public recordPlaylistAdd(song: Song) {
    if (!song?.id) return;
    const signal = this.getOrCreateSignal(song);
    signal.addedToPlaylistCount += 1;
    this.saveSignals();
  }

  /**
   * Deterministic user-interest scoring algorithm
   */
  public getPersonalizedRecommendations(
    candidates: Song[],
    limit: number = 20
  ): RecommendationResult {
    const totalSignals = Object.values(this.signals).length;

    // Cold start: No history yet
    if (totalSignals === 0) {
      return {
        tracks: candidates.slice(0, limit),
        isPersonalized: false,
        headline: 'Trending & Discovery'
      };
    }

    const now = Date.now();
    const artistScores: Record<string, number> = {};
    const languageScores: Record<string, number> = {};
    const genreScores: Record<string, number> = {};
    const albumScores: Record<string, number> = {};
    const recentlyPlayedIds = new Set<string>();

    // Calculate aggregated affinity profiles with time decay
    Object.values(this.signals).forEach(signal => {
      const daysSince = Math.max(0, (now - signal.lastPlayedAt) / (1000 * 60 * 60 * 24));
      // Exponential decay
      const decay = Math.exp(-this.weights.decayRatePerDay * daysSince);

      // Base weight: completions + favorites + playlist adds - skips
      const interactionScore =
        (signal.playCount * 1.0) +
        (signal.isFavorite ? this.weights.favoriteBonus : 0) +
        (signal.addedToPlaylistCount * 3.0) -
        (signal.skipCount * 1.5);

      const effectiveScore = Math.max(0, interactionScore) * decay;

      if (signal.artistId) {
        artistScores[signal.artistId] = (artistScores[signal.artistId] || 0) + effectiveScore;
      }
      if (signal.language) {
        const lang = signal.language.toLowerCase();
        languageScores[lang] = (languageScores[lang] || 0) + effectiveScore;
      }
      if (signal.genre) {
        const g = signal.genre.toLowerCase();
        genreScores[g] = (genreScores[g] || 0) + effectiveScore;
      }
      if (signal.albumId) {
        albumScores[signal.albumId] = (albumScores[signal.albumId] || 0) + effectiveScore;
      }

      // If played within last 6 hours, penalize to avoid repetitive loop
      if (now - signal.lastPlayedAt < 6 * 60 * 60 * 1000) {
        recentlyPlayedIds.add(signal.trackId);
      }
    });

    // Score all candidates
    const scored = candidates
      .filter(s => s && s.id && (s.audioUrl || s.sourceType === 'youtube')) // exclude unplayable items
      .map(song => {
        let score = 0;

        // Affinity factors
        if (song.artistId && artistScores[song.artistId]) {
          score += artistScores[song.artistId] * this.weights.artistWeight;
        }
        if (song.languages && song.languages.length > 0) {
          const matchLang = song.languages.find(l => languageScores[l.toLowerCase()]);
          if (matchLang) {
            score += languageScores[matchLang.toLowerCase()] * this.weights.languageWeight;
          }
        }
        if (song.genreName && genreScores[song.genreName.toLowerCase()]) {
          score += genreScores[song.genreName.toLowerCase()] * this.weights.genreWeight;
        }
        if (song.albumId && albumScores[song.albumId]) {
          score += albumScores[song.albumId] * this.weights.albumWeight;
        }

        // Signal bonuses
        const existingSignal = this.signals[song.id];
        if (existingSignal?.isFavorite) {
          score += this.weights.favoriteBonus;
        }
        if (existingSignal && existingSignal.playCount >= 2) {
          score += this.weights.repeatBonus;
        }

        // Recent fatigue penalty
        if (recentlyPlayedIds.has(song.id)) {
          score -= this.weights.recentTrackPenalty;
        }

        return { song, score };
      });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Enforce diversity: no more than 2 consecutive tracks by the same artist
    const diversified: Song[] = [];
    const pool = [...scored];
    let lastArtistId = '';
    let consecutiveArtistCount = 0;

    while (pool.length > 0 && diversified.length < limit) {
      let chosenIndex = 0;

      for (let i = 0; i < Math.min(pool.length, 5); i++) {
        const candidate = pool[i].song;
        if (candidate.artistId !== lastArtistId || consecutiveArtistCount < 2) {
          chosenIndex = i;
          break;
        }
      }

      const [selected] = pool.splice(chosenIndex, 1);
      diversified.push(selected.song);

      if (selected.song.artistId === lastArtistId) {
        consecutiveArtistCount++;
      } else {
        lastArtistId = selected.song.artistId || '';
        consecutiveArtistCount = 1;
      }
    }

    return {
      tracks: diversified,
      isPersonalized: true,
      headline: 'Made For You'
    };
  }
}

export const recommendationService = new RecommendationService();
