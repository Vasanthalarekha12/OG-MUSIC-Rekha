import type { Song } from '../../types';
import { sanitizeFilename } from '../../utils/stringUtils';

export interface DownloadStatus {
  canDownload: boolean;
  reason?: string;
}

class DownloadService {
  /**
   * Determine if the song is authorized and permitted for direct download
   */
  getDownloadStatus(song?: Song | null): DownloadStatus {
    if (!song) {
      return { canDownload: false, reason: 'No track selected.' };
    }

    if (song.sourceType === 'youtube') {
      return {
        canDownload: false,
        reason: 'Downloads are not permitted for third-party YouTube streams.'
      };
    }

    if (!song.audioUrl) {
      return {
        canDownload: false,
        reason: 'Audio stream is not available for offline download.'
      };
    }

    // Direct audio URL is available and authorized
    return { canDownload: true };
  }

  /**
   * Download the permitted audio file safely with content-type verification
   */
  async downloadSong(
    song: Song,
    _onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; message: string }> {
    const status = this.getDownloadStatus(song);
    if (!status.canDownload) {
      return { success: false, message: status.reason || 'Download not permitted.' };
    }

    try {
      const response = await fetch(song.audioUrl!, {
        method: 'GET',
        headers: {
          Accept: 'audio/*, application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      // Guard against downloading HTML error pages or JSON error payloads as audio
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        throw new Error('Received an invalid audio stream response.');
      }

      // Determine appropriate file extension
      let extension = 'mp3';
      if (contentType.includes('mp4') || contentType.includes('m4a') || contentType.includes('aac')) {
        extension = 'm4a';
      } else if (contentType.includes('wav')) {
        extension = 'wav';
      } else if (contentType.includes('ogg')) {
        extension = 'ogg';
      } else if (song.audioUrl?.includes('.m4a')) {
        extension = 'm4a';
      } else if (song.audioUrl?.includes('.mp3')) {
        extension = 'mp3';
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded audio file is empty.');
      }

      // Safe filename
      const safeTitle = sanitizeFilename(song.title);
      const safeArtist = sanitizeFilename(song.artistName);
      const filename = `${safeTitle} - ${safeArtist}.${extension}`;

      // Trigger download via object URL
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }, 2000);

      return { success: true, message: `Downloaded: ${filename}` };
    } catch (e: any) {
      console.error('Download error:', e);
      return { 
        success: false, 
        message: e?.message || 'Failed to download audio file. Network or server error.' 
      };
    }
  }
}

export const downloadService = new DownloadService();
