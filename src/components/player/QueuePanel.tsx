import React, { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { Artwork } from '../ui/Artwork';
import { X, GripVertical, Trash2, Play } from 'lucide-react';

interface QueuePanelProps {
  onClose: () => void;
}

export const QueuePanel: React.FC<QueuePanelProps> = ({ onClose }) => {
  const { queue, queueIndex, jumpToQueue, clearQueue, removeFromQueue, reorderQueue } = usePlayer();
  
  // Basic drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.parentNode as any);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      reorderQueue(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0a0a0a',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Playing Next</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{queue.length} tracks</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={clearQueue} style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Clear</button>
          <button onClick={onClose} style={{ color: '#fff', padding: '4px' }}><X size={24} /></button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px', scrollbarWidth: 'none' }}>
        {queue.map((item, index) => {
          const isPlaying = index === queueIndex;
          
          return (
            <div 
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => setDraggedIndex(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                margin: '0 -12px',
                borderRadius: '8px',
                backgroundColor: isPlaying ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                opacity: draggedIndex === index ? 0.5 : 1,
                transition: 'background-color 0.2s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden' // for swipe actions
              }}
              onClick={() => jumpToQueue(index)}
            >
              <div 
                style={{ cursor: 'grab', paddingRight: '12px', color: 'var(--text-secondary)' }}
                onClick={(e) => e.stopPropagation()} // don't play when clicking drag handle
              >
                <GripVertical size={20} />
              </div>
              
              <div style={{ width: '48px', height: '48px', marginRight: '16px', position: 'relative' }}>
                <Artwork src={item.song.coverUrl} alt={item.song.title} size="100%" radius="md" />
                {isPlaying && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <Play size={20} fill="#fff" color="#fff" />
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                <p className="line-clamp-1" style={{ fontSize: '16px', fontWeight: 600, color: isPlaying ? 'var(--brand-red)' : '#fff' }}>
                  {item.song.title}
                </p>
                <p className="line-clamp-1" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {item.song.artistName}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromQueue(item.id);
                }}
                style={{ padding: '8px', color: 'var(--text-secondary)' }}
                aria-label="Remove from queue"
              >
                <Trash2 size={20} />
              </button>
            </div>
          );
        })}
        {queue.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            The queue is empty.
          </div>
        )}
      </div>
    </div>
  );
};
