import { slugify } from '../../../utils/stringUtils';

// Curated verified high-resolution portraits for iconic artists to guarantee instant high-fidelity visuals
const VERIFIED_ARTIST_PORTRAITS: Record<string, string> = {
  // Legendary Composers & Singers
  'ar-rahman': 'https://cdn-images.dzcdn.net/images/artist/bd34315ef977a62a9e28c1ab19bb8ac4/500x500-000000-80-0-0.jpg',
  'a-r-rahman': 'https://cdn-images.dzcdn.net/images/artist/bd34315ef977a62a9e28c1ab19bb8ac4/500x500-000000-80-0-0.jpg',
  'anirudh-ravichander': 'https://cdn-images.dzcdn.net/images/artist/9da0a547b39e99bc35c6a9724aef91bf/500x500-000000-80-0-0.jpg',
  'anirudh': 'https://cdn-images.dzcdn.net/images/artist/9da0a547b39e99bc35c6a9724aef91bf/500x500-000000-80-0-0.jpg',
  'sid-sriram': 'https://cdn-images.dzcdn.net/images/artist/fbe3e1d17fc6958e047f011f74233f82/500x500-000000-80-0-0.jpg',
  'shreya-ghoshal': 'https://cdn-images.dzcdn.net/images/artist/3bb832d37d10ff2affcfa9afdc7c68a0/500x500-000000-80-0-0.jpg',
  'ilaiyaraaja': 'https://cdn-images.dzcdn.net/images/artist/aeeca2a4b9f808c8e8f5d281b1fb48d0/500x500-000000-80-0-0.jpg',
  'ilayaraja': 'https://cdn-images.dzcdn.net/images/artist/aeeca2a4b9f808c8e8f5d281b1fb48d0/500x500-000000-80-0-0.jpg',
  'devi-sri-prasad': 'https://cdn-images.dzcdn.net/images/artist/a904f8ee6cc4dcb472f75bd8ae1a21da/500x500-000000-80-0-0.jpg',
  'dsp': 'https://cdn-images.dzcdn.net/images/artist/a904f8ee6cc4dcb472f75bd8ae1a21da/500x500-000000-80-0-0.jpg',
  'thaman-s': 'https://cdn-images.dzcdn.net/images/artist/fe520c37ba48ea96638cf2f52f1bbc08/500x500-000000-80-0-0.jpg',
  's-thaman': 'https://cdn-images.dzcdn.net/images/artist/fe520c37ba48ea96638cf2f52f1bbc08/500x500-000000-80-0-0.jpg',
  'ss-thaman': 'https://cdn-images.dzcdn.net/images/artist/fe520c37ba48ea96638cf2f52f1bbc08/500x500-000000-80-0-0.jpg',
  'harris-jayaraj': 'https://cdn-images.dzcdn.net/images/artist/b10caf45eae518a2b16997874ded7143/500x500-000000-80-0-0.jpg',
  'yuvan-shankar-raja': 'https://cdn-images.dzcdn.net/images/artist/1dbf7d81a2e964d9c707e53478407974/500x500-000000-80-0-0.jpg',
  'gv-prakash-kumar': 'https://cdn-images.dzcdn.net/images/artist/e9c4be67e7e086a81cb8ab3d0160d45a/500x500-000000-80-0-0.jpg',
  'g-v-prakash-kumar': 'https://cdn-images.dzcdn.net/images/artist/e9c4be67e7e086a81cb8ab3d0160d45a/500x500-000000-80-0-0.jpg',
  'mm-keeravani': 'https://cdn-images.dzcdn.net/images/artist/5d78a2351117fed4d9d9c564de968a7e/500x500-000000-80-0-0.jpg',
  'm-m-keeravani': 'https://cdn-images.dzcdn.net/images/artist/5d78a2351117fed4d9d9c564de968a7e/500x500-000000-80-0-0.jpg',
  'sp-balasubrahmanyam': 'https://cdn-images.dzcdn.net/images/artist/a7616b75bb05438bdc4efc9502323228/500x500-000000-80-0-0.jpg',
  's-p-balasubrahmanyam': 'https://cdn-images.dzcdn.net/images/artist/a7616b75bb05438bdc4efc9502323228/500x500-000000-80-0-0.jpg',
  'ks-chithra': 'https://cdn-images.dzcdn.net/images/artist/b955b3207b61e722cf4d63ee0c762b12/500x500-000000-80-0-0.jpg',
  'k-s-chithra': 'https://cdn-images.dzcdn.net/images/artist/b955b3207b61e722cf4d63ee0c762b12/500x500-000000-80-0-0.jpg',
  's-janaki': 'https://cdn-images.dzcdn.net/images/artist/9a574b0ffd51ce37f3fa3e6556b77d7c/500x500-000000-80-0-0.jpg',
  'arijit-singh': 'https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg',
  'santhosh-narayanan': 'https://cdn-images.dzcdn.net/images/artist/74004fed94dddf9ae2d7c83084eaf1ad/500x500-000000-80-0-0.jpg',
  'shankar-mahadevan': 'https://cdn-images.dzcdn.net/images/artist/aefd6e3d941a0a1fd8baea6cf4a03c6a/500x500-000000-80-0-0.jpg',
  'chinmayi-sripaada': 'https://cdn-images.dzcdn.net/images/artist/2348c0926bfb8e5ae536c7354658ac50/500x500-000000-80-0-0.jpg',
  'chinmayi': 'https://cdn-images.dzcdn.net/images/artist/2348c0926bfb8e5ae536c7354658ac50/500x500-000000-80-0-0.jpg',
  'dhee': 'https://cdn-images.dzcdn.net/images/artist/011b57430ce0f654bf5deb01b70f365e/500x500-000000-80-0-0.jpg',
  'pradeep-kumar': 'https://cdn-images.dzcdn.net/images/artist/87c0266a02406bc9c500bd3620d1d52b/500x500-000000-80-0-0.jpg',
  'vishal-mishra': 'https://cdn-images.dzcdn.net/images/artist/6125247795ee1f0b64253a1e993e7b0e/500x500-000000-80-0-0.jpg',
  'jonita-gandhi': 'https://cdn-images.dzcdn.net/images/artist/f756c825ab0eb367cd85f077c28d0719/500x500-000000-80-0-0.jpg',
  'hariharan': 'https://cdn-images.dzcdn.net/images/artist/ead44b7f4f45556dc37b026b18040ece/500x500-000000-80-0-0.jpg',
  'armaan-malik': 'https://cdn-images.dzcdn.net/images/artist/3aacd4e00a34aefb6041d30e0cc5bc5e/500x500-000000-80-0-0.jpg',
  'karthik': 'https://cdn-images.dzcdn.net/images/artist/b13e79b8bdc0f6581d4489e406407c24/500x500-000000-80-0-0.jpg',
  'haricharan': 'https://cdn-images.dzcdn.net/images/artist/923607e2ef5b425a8c6203f7439ad44f/500x500-000000-80-0-0.jpg',
  'vijay-prakash': 'https://cdn-images.dzcdn.net/images/artist/3d112cbc8570a026002b7e05142dc191/500x500-000000-80-0-0.jpg',
  'benny-dayal': 'https://cdn-images.dzcdn.net/images/artist/4f5cd00e45008050296c3845d153452f/500x500-000000-80-0-0.jpg',
  'sunidhi-chauhan': 'https://cdn-images.dzcdn.net/images/artist/37dbd33ae8cf7075e247968acf4b48da/500x500-000000-80-0-0.jpg',
  'mika-singh': 'https://cdn-images.dzcdn.net/images/artist/b3f6841397bac761e26784959abd42b8/500x500-000000-80-0-0.jpg',
  'andrea-jeremiah': 'https://cdn-images.dzcdn.net/images/artist/ae85e6eb82700b631c1d6bf92e87a1aa/500x500-000000-80-0-0.jpg',
  // Western Icons
  'taylor-swift': 'https://cdn-images.dzcdn.net/images/artist/cc2495870fe1a792ad0cdb05501ad5ec/500x500-000000-80-0-0.jpg',
  'the-weeknd': 'https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/500x500-000000-80-0-0.jpg',
  'ed-sheeran': 'https://cdn-images.dzcdn.net/images/artist/d6bb84390641d8ae9118228d9544e53d/500x500-000000-80-0-0.jpg',
  'coldplay': 'https://cdn-images.dzcdn.net/images/artist/3087954bca22f306324912e5ac8375c3/500x500-000000-80-0-0.jpg',
  'billie-eilish': 'https://cdn-images.dzcdn.net/images/artist/8eab1a9a644889aabaca1e193e05f984/500x500-000000-80-0-0.jpg'
};

class ArtistProfileService {
  private portraitCache = new Map<string, string | null>();

  /**
   * Resolve an actual artist portrait photo.
   * Never returns a song cover or album artwork!
   */
  async resolveArtistPhoto(artistName: string): Promise<string | undefined> {
    const cleanName = (artistName || '').trim();
    if (!cleanName) return undefined;

    const slug = slugify(cleanName);

    // 1. Direct curated match
    if (VERIFIED_ARTIST_PORTRAITS[slug]) {
      return VERIFIED_ARTIST_PORTRAITS[slug];
    }

    // 2. Check primary artist if string contains multiple performers (e.g. "Anirudh Ravichander, Sid Sriram")
    const primaryName = cleanName.split(/[,&/]/)[0].trim();
    const primarySlug = slugify(primaryName);
    if (VERIFIED_ARTIST_PORTRAITS[primarySlug]) {
      return VERIFIED_ARTIST_PORTRAITS[primarySlug];
    }

    // 3. Cache lookup
    if (this.portraitCache.has(slug)) {
      return this.portraitCache.get(slug) || undefined;
    }

    // 4. Provider query to fetch verified artist picture
    try {
      const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(primaryName)}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const candidate = data.data?.[0];
        if (candidate) {
          const pic = candidate.picture_big || candidate.picture_medium || candidate.picture;
          // Deezer returns empty placeholder path with no hash if no photo exists
          if (pic && !pic.includes('/images/artist//')) {
            this.portraitCache.set(slug, pic);
            return pic;
          }
        }
      }
    } catch (e) {
      // Network error or rate limit, fail cleanly without throwing
    }

    this.portraitCache.set(slug, null);
    return undefined; // Return undefined so UI renders a neutral person avatar
  }

  /**
   * Split multiple performers into distinct clean artist entities
   */
  splitPerformers(artistString: string): string[] {
    if (!artistString) return [];
    return artistString
      .split(/[,;&]|\s+feat\.?\s+|\s+ft\.?\s+/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().includes('cast') && !s.toLowerCase().includes('various'));
  }
}

export const artistProfileService = new ArtistProfileService();
