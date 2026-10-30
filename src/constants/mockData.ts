import type { Song, Artist, Album, Playlist, Genre, Video } from '../types';

export const mockSongs: Song[] = [
  {
    id: 'devara-fear-song',
    youtubeId: 'CKpbdCciELk',
    sourceType: 'youtube',
    title: 'Fear Song',
    artistId: 'anirudh-ravichander',
    artistName: 'Anirudh Ravichander',
    albumId: 'album-devara',
    albumName: 'Devara: Part 1',
    duration: 195,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    isFeatured: true,
    genreId: 'g1',
    moods: ['Mass', 'Energetic'],
    languages: ['Telugu']
  },
  {
    id: 'devara-chuttamalle',
    youtubeId: 'GWNrPJyRTcA',
    sourceType: 'youtube',
    title: 'Chuttamalle',
    artistId: 'anirudh-ravichander',
    artistName: 'Shilpa Rao, Anirudh Ravichander',
    albumId: 'album-devara',
    albumName: 'Devara: Part 1',
    duration: 228,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&q=80',
    isFeatured: true,
    genreId: 'g1',
    moods: ['Romantic', 'Melody'],
    languages: ['Telugu']
  },
  {
    id: 'pushpa2-pushpa-pushpa',
    youtubeId: 'gKKDbWAKL9U',
    sourceType: 'youtube',
    title: 'Pushpa Pushpa',
    artistId: 'devi-sri-prasad',
    artistName: 'Devi Sri Prasad, Nakash Aziz',
    albumId: 'album-pushpa-2',
    albumName: 'Pushpa 2: The Rule',
    duration: 256,
    coverUrl: 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?w=800&q=80',
    isFeatured: true,
    genreId: 'g1',
    moods: ['Mass', 'Energetic'],
    languages: ['Telugu']
  },
  {
    id: 'pushpa2-angaaron',
    youtubeId: '0DVAM48BhQU',
    sourceType: 'youtube',
    title: 'Angaaron (The Couple Song)',
    artistId: 'devi-sri-prasad',
    artistName: 'Shreya Ghoshal, Devi Sri Prasad',
    albumId: 'album-pushpa-2',
    albumName: 'Pushpa 2: The Rule',
    duration: 260,
    coverUrl: 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?w=800&q=80',
    isFeatured: true,
    genreId: 'g1',
    moods: ['Romantic', 'Happy'],
    languages: ['Telugu']
  },
  {
    id: 'rrr-naatu-naatu',
    youtubeId: '4_eEgJhsBMo',
    sourceType: 'youtube',
    title: 'Naatu Naatu',
    artistId: 'mm-keeravaani',
    artistName: 'Rahul Sipligunj, Kaala Bhairava, M.M. Keeravaani',
    albumId: 'album-rrr',
    albumName: 'RRR',
    duration: 275,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    isFeatured: true,
    genreId: 'g1',
    moods: ['Energetic', 'Mass'],
    languages: ['Telugu']
  },
  {
    id: 'kalki-bhairava-anthem',
    youtubeId: '5UfGZFrXKig',
    sourceType: 'youtube',
    title: 'Bhairava Anthem',
    artistId: 'santhosh-narayanan',
    artistName: 'Diljit Dosanjh, Santhosh Narayanan',
    albumId: 'album-kalki',
    albumName: 'Kalki 2898 AD',
    duration: 215,
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=800&q=80',
    genreId: 'g1',
    moods: ['Mass', 'Energetic'],
    languages: ['Telugu', 'Punjabi']
  },
  {
    id: 'leo-naa-ready',
    youtubeId: '3wDiqlTNlfQ',
    sourceType: 'youtube',
    title: 'Naa Ready',
    artistId: 'anirudh-ravichander',
    artistName: 'Thalapathy Vijay, Anirudh Ravichander',
    albumId: 'album-leo',
    albumName: 'Leo',
    duration: 248,
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80',
    isFeatured: true,
    genreId: 'g2',
    moods: ['Mass', 'Energetic'],
    languages: ['Tamil', 'Telugu']
  },
  {
    id: 'animal-arjan-vailly',
    youtubeId: 'zqGW6x_5N0k',
    sourceType: 'youtube',
    title: 'Arjan Vailly',
    artistId: 'bhupinder-babbal',
    artistName: 'Bhupinder Babbal, Manan Bhardwaj',
    albumId: 'album-animal',
    albumName: 'Animal',
    duration: 182,
    coverUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80',
    genreId: 'g3',
    moods: ['Mass', 'Energetic'],
    languages: ['Hindi', 'Punjabi']
  }
];

export const mockArtists: Artist[] = [
  { id: 'anirudh-ravichander', name: 'Anirudh Ravichander', imageUrl: 'https://images.unsplash.com/photo-1516280440502-37f8ce387d55?w=500&q=80' },
  { id: 'devi-sri-prasad', name: 'Devi Sri Prasad (DSP)', imageUrl: 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?w=500&q=80' },
  { id: 'mm-keeravaani', name: 'M.M. Keeravaani', imageUrl: 'https://images.unsplash.com/photo-1570280456108-0130d2105151?w=500&q=80' },
  { id: 'santhosh-narayanan', name: 'Santhosh Narayanan', imageUrl: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=500&q=80' },
  { id: 'ar-rahman', name: 'A.R. Rahman', imageUrl: 'https://images.unsplash.com/photo-1520626338573-3b68f5664560?w=500&q=80' },
  { id: 'thaman-s', name: 'Thaman S', imageUrl: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=500&q=80' },
];

export const mockAlbums: Album[] = [
  { id: 'album-devara', title: 'Devara: Part 1', artistId: 'anirudh-ravichander', artistName: 'Anirudh Ravichander', releaseYear: 2024, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', songCount: 4 },
  { id: 'album-pushpa-2', title: 'Pushpa 2: The Rule', artistId: 'devi-sri-prasad', artistName: 'Devi Sri Prasad', releaseYear: 2024, coverUrl: 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?w=500&q=80', songCount: 5 },
  { id: 'album-rrr', title: 'RRR', artistId: 'mm-keeravaani', artistName: 'M.M. Keeravaani', releaseYear: 2022, coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', songCount: 7 },
  { id: 'album-kalki', title: 'Kalki 2898 AD', artistId: 'santhosh-narayanan', artistName: 'Santhosh Narayanan', releaseYear: 2024, coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=500&q=80', songCount: 5 },
  { id: 'album-leo', title: 'Leo', artistId: 'anirudh-ravichander', artistName: 'Anirudh Ravichander', releaseYear: 2023, coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', songCount: 6 },
  { id: 'album-animal', title: 'Animal', artistId: 'various-artists', artistName: 'Various Artists', releaseYear: 2023, coverUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=500&q=80', songCount: 8 },
];

export const mockPlaylists: Playlist[] = [
  { id: 'p1', userId: 'u1', title: 'OG Mass Hits', description: 'High voltage mass anthems from Indian cinema.', isPublic: true, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', songs: [] },
  { id: 'p2', userId: 'u1', title: 'Late Night Melodies', description: 'Soulful acoustic & romantic Telugu melodies.', isPublic: true, coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80', songs: [] },
  { id: 'p3', userId: 'u1', title: 'Anirudh Explosion', description: 'Unstoppable beats and viral tracks by Anirudh.', isPublic: true, coverUrl: 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?w=500&q=80', songs: [] },
  { id: 'p4', userId: 'u1', title: 'Pan-India Blockbusters', description: 'RRR, Pushpa 2, Kalki, Devara, KGF & Salaar.', isPublic: true, coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', songs: [] },
];

export const mockGenres: Genre[] = [
  { id: 'g1', name: 'Telugu', imageUrl: 'https://images.unsplash.com/photo-1588775468725-b467611bd9fa?w=500&q=80' },
  { id: 'g2', name: 'Tamil', imageUrl: 'https://images.unsplash.com/photo-1596700725516-09a2503d27eb?w=500&q=80' },
  { id: 'g3', name: 'Hindi', imageUrl: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=500&q=80' },
  { id: 'g4', name: 'English', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f56468?w=500&q=80' },
  { id: 'g5', name: 'Melody', imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80' },
  { id: 'g6', name: 'Mass', imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?w=500&q=80' },
  { id: 'g7', name: 'Romantic', imageUrl: 'https://images.unsplash.com/photo-1518599904199-0ca897819ddb?w=500&q=80' },
  { id: 'g8', name: 'Devotional', imageUrl: 'https://images.unsplash.com/photo-1601666687277-3e1147f2022b?w=500&q=80' },
];

export const mockVideos: Video[] = [
  { id: 'v1', title: 'Devara — Fear Song (Official Video)', artistId: 'anirudh-ravichander', artistName: 'Anirudh Ravichander', videoUrl: 'https://www.youtube.com/watch?v=e_tYx3y0E5s', thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', duration: 195 },
  { id: 'v2', title: 'Pushpa 2 — Pushpa Pushpa (Official Video)', artistId: 'devi-sri-prasad', artistName: 'Devi Sri Prasad', videoUrl: 'https://www.youtube.com/watch?v=lA45V_y9g3M', thumbnailUrl: 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?w=800&q=80', duration: 256 },
];
