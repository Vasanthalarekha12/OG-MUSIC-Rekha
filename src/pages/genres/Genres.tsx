
import { mockGenres } from '../../constants/mockData';
import { Link } from 'react-router-dom';

export const Genres = () => {
  // Array of gradients to apply to genres dynamically
  const gradients = [
    'linear-gradient(135deg, #FF007A 0%, #7A00FF 100%)',
    'linear-gradient(135deg, #00E5FF 0%, #0055FF 100%)',
    'linear-gradient(135deg, #FF3D00 0%, #FF9100 100%)',
    'linear-gradient(135deg, #00C853 0%, #009688 100%)',
    'linear-gradient(135deg, #6200EA 0%, #2962FF 100%)',
    'linear-gradient(135deg, #D50000 0%, #C51162 100%)',
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Genres
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Browse by genre and mood</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '24px' 
      }}>
        {mockGenres.map((genre, index) => {
          const bg = gradients[index % gradients.length];
          return (
            <Link 
              key={genre.id}
              to={`/genre/${genre.id}`}
              className="hover-lift"
              style={{
                position: 'relative',
                height: '120px',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                textDecoration: 'none',
                display: 'block'
              }}
            >
              <div style={{
                position: 'absolute',
                inset: 0,
                background: bg,
                opacity: 0.8,
              }} />
              <div style={{
                position: 'absolute',
                right: '-20px',
                bottom: '-20px',
                width: '100px',
                height: '100px',
                backgroundImage: `url(${genre.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: 'rotate(25deg)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
                borderRadius: 'var(--radius-sm)'
              }} />
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}>
                {genre.name}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
