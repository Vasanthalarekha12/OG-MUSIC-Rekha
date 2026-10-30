export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
}

export interface YouTubeSearchResult {
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: YouTubeVideoSnippet;
}

export interface YouTubeSearchResponse {
  nextPageToken?: string;
  items: YouTubeSearchResult[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}
