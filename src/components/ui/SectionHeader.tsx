import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: (e: React.MouseEvent) => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  subtitle, 
  actionText, 
  actionLink,
  onActionClick
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
      <div>
        {subtitle && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', fontWeight: 600 }}>
            {subtitle}
          </div>
        )}
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>
      
      {actionText && (actionLink || onActionClick) && (
        onActionClick ? (
          <button 
            onClick={onActionClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {actionText}
            <ChevronRight size={16} />
          </button>
        ) : (
          <Link 
            to={actionLink!}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            {actionText}
            <ChevronRight size={16} />
          </Link>
        )
      )}
    </div>
  );
};
