import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Play, ListPlus, Heart, Plus, MoreVertical, ListMusic, User, Disc, PlaySquare, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../../contexts/PlayerContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { downloadService } from '../../services/download/downloadService';
import type { Song } from '../../types';

interface TrackContextMenuProps {
  song: Song;
}

export const TrackContextMenu = ({ song }: TrackContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { play, playNext, addToQueue } = usePlayer();
  const { toggleFavorite, isFavorite } = useLibrary();
  const navigate = useNavigate();

  const downloadStatus = downloadService.getDownloadStatus(song);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    if (!downloadStatus.canDownload) {
      setDownloadFeedback(downloadStatus.reason || 'Restricted audio: stream in app');
      setTimeout(() => {
        setDownloadFeedback(null);
      }, 3500);
      return;
    }

    setIsDownloading(true);
    setDownloadFeedback('Downloading audio...');
    const result = await downloadService.downloadSong(song);
    setIsDownloading(false);
    setDownloadFeedback(result.success ? 'Downloaded!' : result.message);
    setTimeout(() => {
      setDownloadFeedback(null);
      setIsOpen(false);
    }, 2500);
  };

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const handleScroll = () => {
      if (isOpen) closeMenu();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeMenu]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position menu below the button, aligned to the right edge
      setMenuPosition({ 
        top: rect.bottom + window.scrollY, 
        right: window.innerWidth - rect.right 
      });
    }
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const fav = isFavorite(song.id);

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className="hover-lift"
        style={{ padding: '8px', color: 'var(--text-muted)', backgroundColor: 'transparent', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <MoreVertical size={20} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          style={{
            position: 'absolute',
            right: `${menuPosition.right}px`,
            top: `${menuPosition.top}px`,
            zIndex: 9999,
            backgroundColor: 'var(--surface-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 0',
            minWidth: '200px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
            border: '1px solid var(--border)'
          }}
        >
          <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => play(song)); }}>
            <Play size={16} /> Play Now
          </div>
          <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => playNext(song)); }}>
            <ListPlus size={16} /> Play Next
          </div>
          <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => addToQueue(song)); }}>
            <Plus size={16} /> Add to Queue
          </div>
          <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); setIsOpen(false); setShowPlaylistModal(true); }}>
            <ListMusic size={16} /> Add to Playlist
          </div>
          <div style={{ margin: '4px 0', borderBottom: '1px solid var(--border)' }} />
          <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => toggleFavorite(song)); }}>
            <Heart size={16} fill={fav ? 'var(--brand-red)' : 'none'} color={fav ? 'var(--brand-red)' : 'currentColor'} /> 
            {fav ? 'Remove from Favorites' : 'Add to Favorites'}
          </div>

          <div style={{ margin: '4px 0', borderBottom: '1px solid var(--border)' }} />

          <div 
            className="context-menu-item" 
            style={{ 
              minHeight: '44px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: downloadStatus.canDownload ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer'
            }} 
            onClick={handleDownload}
            title={downloadStatus.canDownload ? 'Download audio track' : (downloadStatus.reason || 'Streaming only')}
          >
            {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span style={{ fontSize: '13px' }}>
              {downloadFeedback || (downloadStatus.canDownload ? 'Download Audio' : `Download (${song.sourceType === 'youtube' ? 'YouTube Restricted' : 'Streaming Only'})`)}
            </span>
          </div>
          
          {song.sourceType === 'youtube' ? (
            <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => window.open(`https://youtube.com/watch?v=${song.id}`, '_blank')); }}>
              <PlaySquare size={16} /> Open YouTube
            </div>
          ) : (
            <>
              {song.artistId && (
                <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => navigate(`/artist/${song.artistId}`)); }}>
                  <User size={16} /> Go to Artist
                </div>
              )}
              {song.albumId && (
                <div className="context-menu-item" style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }} onClick={(e) => { e.stopPropagation(); handleAction(() => navigate(`/album/${song.albumId}`)); }}>
                  <Disc size={16} /> Go to Album
                </div>
              )}
            </>
          )}
        </div>,
        document.body
      )}

      {showPlaylistModal && (
        <AddToPlaylistModal song={song} onClose={() => setShowPlaylistModal(false)} />
      )}
    </>
  );
};
