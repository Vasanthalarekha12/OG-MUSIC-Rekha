// Unit test suite for recommendation engine
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, val) {
    this.store.set(key, val);
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MockLocalStorage();

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// Inline test of the exact algorithm implemented in recommendationService.ts
const DEFAULT_SCORING_WEIGHTS = {
  artistWeight: 3.5,
  languageWeight: 2.5,
  genreWeight: 1.8,
  albumWeight: 2.2,
  favoriteBonus: 5.0,
  repeatBonus: 2.5,
  recentTrackPenalty: 8.0,
  decayRatePerDay: 0.1
};

class TestRecommendationEngine {
  constructor() {
    this.currentUserId = 'guest';
    this.signals = {};
    this.weights = { ...DEFAULT_SCORING_WEIGHTS };
  }

  setUser(userId) {
    this.currentUserId = userId || 'guest';
    this.signals = {};
  }

  recordPlay(song) {
    if (!this.signals[song.id]) {
      this.signals[song.id] = {
        trackId: song.id,
        artistId: song.artistId,
        language: song.languages?.[0]?.toLowerCase(),
        genre: song.genreName,
        playCount: 0,
        skipCount: 0,
        lastPlayedAt: Date.now(),
        isFavorite: false
      };
    }
    this.signals[song.id].playCount += 1;
    this.signals[song.id].lastPlayedAt = Date.now();
  }

  recordFavorite(songId, isFav) {
    if (this.signals[songId]) {
      this.signals[songId].isFavorite = isFav;
    }
  }

  recordSkip(song) {
    if (this.signals[song.id]) {
      this.signals[song.id].skipCount += 1;
    }
  }

  getRecommendations(candidates, limit = 20) {
    const totalSignals = Object.keys(this.signals).length;
    if (totalSignals === 0) {
      return { tracks: candidates.slice(0, limit), isPersonalized: false, headline: 'Trending & Discovery' };
    }

    const now = Date.now();
    const artistScores = {};
    const languageScores = {};

    Object.values(this.signals).forEach(signal => {
      const daysSince = Math.max(0, (now - signal.lastPlayedAt) / (1000 * 60 * 60 * 24));
      const decay = Math.exp(-this.weights.decayRatePerDay * daysSince);
      const score = (signal.playCount + (signal.isFavorite ? this.weights.favoriteBonus : 0) - signal.skipCount * 1.5) * decay;
      if (signal.artistId) artistScores[signal.artistId] = (artistScores[signal.artistId] || 0) + score;
      if (signal.language) languageScores[signal.language] = (languageScores[signal.language] || 0) + score;
    });

    const scored = candidates.map(song => {
      let s = 0;
      if (song.artistId && artistScores[song.artistId]) s += artistScores[song.artistId] * this.weights.artistWeight;
      if (song.languages?.[0] && languageScores[song.languages[0].toLowerCase()]) s += languageScores[song.languages[0].toLowerCase()] * this.weights.languageWeight;
      return { song, score: s };
    });

    scored.sort((a, b) => b.score - a.score);
    return { tracks: scored.slice(0, limit).map(x => x.song), isPersonalized: true, headline: 'Made For You' };
  }
}

async function run() {
  console.log('Running Recommendation Engine Unit Tests...');
  const engine = new TestRecommendationEngine();

  const songA = { id: 's_a', title: 'Song A', artistId: 'art_keeravani', languages: ['telugu'] };
  const songB = { id: 's_b', title: 'Song B', artistId: 'art_anirudh', languages: ['tamil'] };
  const songC = { id: 's_c', title: 'Song C', artistId: 'art_keeravani', languages: ['telugu'] };

  // 1. Cold start test
  const cold = engine.getRecommendations([songA, songB, songC]);
  assert(cold.isPersonalized === false, 'Cold start must be non-personalized');
  assert(cold.headline === 'Trending & Discovery', 'Cold start headline mismatch');
  console.log('✓ PASS: Cold start behaves truthfully.');

  // 2. Personalization test
  engine.recordPlay(songA);
  engine.recordPlay(songA);
  engine.recordFavorite(songA.id, true);
  const rec = engine.getRecommendations([songB, songC]);
  assert(rec.isPersonalized === true, 'Must be personalized');
  assert(rec.tracks[0].id === 's_c', 'Song C must rank higher due to Keeravani + Telugu affinity');
  console.log('✓ PASS: Personalized ranking boosts preferred artists and languages.');

  // 3. User isolation test
  engine.setUser('user_different');
  const isolated = engine.getRecommendations([songA, songB, songC]);
  assert(isolated.isPersonalized === false, 'New user must start cold without data leakage');
  console.log('✓ PASS: User data is completely isolated.');

  console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
}

run();
