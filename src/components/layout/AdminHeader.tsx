import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminHeader = () => {
  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sticky)',
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
        Dashboard Overview
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
          Back to App
        </Link>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
          <LogOut size={18} />
          <span style={{ fontSize: 'var(--text-sm)' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};
