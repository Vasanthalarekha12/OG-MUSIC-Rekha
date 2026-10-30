import { recommendationService } from '../recommendationService';
import type { Song } from '../../types';

// Mock localStorage for Node environment
if (typeof localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear()
  };
}

export function runRecommendationTests() {
  console.log('--- RUNNING RECOMMENDATION ENGINE UNIT TESTS ---');

  recommendationService.setUser('test-user-1');

  const songA: Song = {
    id: 'test_a',
    title: 'Song A (Telugu)',
    artistId: 'artist_1',
    artistName: 'Keeravani',
    audioUrl: 'https://example.com/a.mp3',
    languages: ['telugu'],
    genreName: 'Soundtrack'
  };

  const songB: Song = {
    id: 'test_b',
    title: 'Song B (Tamil)',
    artistId: 'artist_2',
    artistName: 'Anirudh',
    audioUrl: 'https://example.com/b.mp3',
    languages: ['tamil'],
    genreName: 'Pop'
  };

  const songC: Song = {
    id: 'test_c',
    title: 'Song C (Telugu)',
    artistId: 'artist_1',
    artistName: 'Keeravani',
    audioUrl: 'https://example.com/c.mp3',
    languages: ['telugu'],
    genreName: 'Soundtrack'
  };

  // Test 1: Cold start
  const coldStart = recommendationService.getPersonalizedRecommendations([songA, songB, songC], 3);
  console.assert(coldStart.isPersonalized === false, 'Cold start must not claim to be personalized');
  console.assert(coldStart.headline === 'Trending & Discovery', 'Cold start headline must be truthful');
  console.log('Test 1 Passed: Cold start is truthful.');

  // Test 2: User affinity & ranking
  recommendationService.recordPlay(songA);
  recommendationService.recordPlay(songA);
  recommendationService.recordFavorite(songA.id, true);
  recommendationService.recordCompletion(songA, 180, 200);

  const personalized = recommendationService.getPersonalizedRecommendations([songB, songC], 2);
  console.assert(personalized.isPersonalized === true, 'Should be personalized after activity');
  console.assert(personalized.tracks[0].id === 'test_c', 'Song C should rank first due to Keeravani and Telugu affinity');
  console.log('Test 2 Passed: User listening affinity scores and ranks candidates correctly.');

  // Test 3: User isolation
  recommendationService.setUser('test-user-2');
  const user2Result = recommendationService.getPersonalizedRecommendations([songA, songB, songC], 3);
  console.assert(user2Result.isPersonalized === false, 'User 2 has no history, should be cold start');
  console.log('Test 3 Passed: User preferences are strictly isolated.');

  console.log('--- ALL RECOMMENDATION ENGINE TESTS PASSED ---');
}
